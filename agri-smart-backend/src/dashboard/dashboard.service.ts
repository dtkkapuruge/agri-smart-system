import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getFarmerStats(farmerIdParam: string) {
    // farmerIdParam could be user_id from Supabase or profile_id from FarmerProfile
    let farmerProfile = await this.prisma.farmerProfile.findFirst({
      where: {
        OR: [
          { profile_id: farmerIdParam },
          { user_id: farmerIdParam }
        ]
      }
    });
    const farmerId = farmerProfile ? farmerProfile.profile_id : farmerIdParam;

    // Total submissions
    const totalSubmissions = await this.prisma.gradingSubmission.count({
      where: { farmer_id: farmerId },
    });

    // Revenue
    const submissionsWithPrice = await this.prisma.gradingSubmission.findMany({
      where: { farmer_id: farmerId },
      select: { final_price: true, ai_grade: true },
    });

    let revenue = 0;
    let gradeACount = 0;
    
    submissionsWithPrice.forEach((sub) => {
      revenue += Number(sub.final_price);
      if (sub.ai_grade === 'A') {
        gradeACount++;
      }
    });

    const gradeARate = totalSubmissions > 0 
      ? Math.round((gradeACount / totalSubmissions) * 100) 
      : null;

    // Open Orders (pending matched orders)
    const openOrders = await this.prisma.matchingLog.count({
      where: { notified_farmer_id: farmerId, response_status: 'PENDING' },
    });

    // Recent 5 submissions
    const recentSubmissions = await this.prisma.gradingSubmission.findMany({
      where: { farmer_id: farmerId },
      orderBy: { created_at: 'desc' },
      take: 5,
    });

    return {
      totalSubmissions,
      gradeARate,
      revenue,
      openOrders,
      recentSubmissions,
    };
  }

  async getBuyerStats(buyerIdParam: string) {
    let buyerProfile = await this.prisma.buyerProfile.findFirst({
      where: {
        OR: [
          { profile_id: buyerIdParam },
          { user_id: buyerIdParam }
        ]
      }
    });
    const buyerId = buyerProfile ? buyerProfile.profile_id : buyerIdParam;

    const activeOrders = await this.prisma.order.count({
      where: { buyer_id: buyerId, status: { in: ['PENDING', 'MATCHED'] } },
    });

    const completedOrders = await this.prisma.order.findMany({
      where: { buyer_id: buyerId, status: { in: ['PAID', 'DELIVERED'] } },
      include: { ai_report: true, payment: true },
    });

    let totalSpent = 0;
    completedOrders.forEach(o => {
       if (o.payment) totalSpent += Number(o.payment.amount);
       else if (o.ai_report) totalSpent += Number(o.ai_report.final_price);
    });

    const grades = completedOrders.map(o => o.ai_report?.ai_grade).filter(g => g);
    let avgGrade = 'N/A';
    if (grades.length > 0) {
      const gradeCounts = { A: 0, B: 0, C: 0 };
      grades.forEach(g => {
        const gradeKey = g as keyof typeof gradeCounts;
        if (gradeCounts[gradeKey] !== undefined) gradeCounts[gradeKey]++; 
      });
      const maxGrade = Object.keys(gradeCounts).reduce((a, b) => 
        gradeCounts[a as keyof typeof gradeCounts] > gradeCounts[b as keyof typeof gradeCounts] ? a : b
      );
      avgGrade = gradeCounts[maxGrade as keyof typeof gradeCounts] > 0 ? maxGrade : 'N/A';
    }

    return {
      cartItems: 0,
      activeOrders,
      totalSpent,
      avgGrade
    };
  }
}
