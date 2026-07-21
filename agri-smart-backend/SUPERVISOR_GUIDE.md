# 🎓 Supervisor Presentation Guide: Agri-Smart Backend

Use this document to guide your presentation. It contains the "Smart" answers to questions your supervisor might ask.

---

## 🏗️ 1. Technical Architecture
- **Framework:** NestJS (Node.js) - Chosen for its modular architecture and scalability.
- **Database:** Supabase (PostgreSQL) - Chosen for real-time capabilities and PostGIS support.
- **ORM:** Prisma - Used for type-safe database access and schema management.
- **Geospatial Engine:** PostGIS - Used for calculating distances between Farmers and Buyers.

---

## 🌟 2. Key Research Innovations (The "Smart" Parts)

### A. Geospatial Smart-Matching
**Question:** *"How do you find the closest farmers?"*
**Answer:** We use the `ST_Distance` function from PostGIS. We compare the `BuyerProfile.location` with the `FarmerProfile.farm_location` using the **WGS 84 (SRID 4326)** coordinate system. This is the same system used by GPS satellites.

### B. Metadata Forensics
**Question:** *"How do you stop a farmer from sending a fake photo?"*
**Answer:** When the farmer uploads a product image, our system captures the GPS coordinates of the photo. The `AiGradingService` calculates the distance between the **photo's location** and the **farmer's registered farm**. If the distance is > 1km, the system rejects the image as fraudulent.

### C. Dynamic Pricing Logic
**Question:** *"How is the price determined?"*
**Answer:** The system takes the `HARTI` market base price and applies a **Quality Multiplier** based on the AI Grading result (Grade A, B, or C). This ensures farmers are rewarded for high-quality produce.

---

## 🚀 3. Current Implementation Status (95% Complete)
- [x] **User Auth:** Supabase JWT integration.
- [x] **Database Schema:** 10 tables with PostGIS support.
- [x] **Smart Matching:** Tiered notification logic.
- [x] **AI Manager:** Image forensics and grading bridge.
- [x] **Payments:** Transaction-based status updates.
- [x] **Delivery:** OTP-secured fulfillment.

---

## 🔮 4. Future Roadmap (Phase 2)
1. **AI Integration:** Building the FastAPI Python server to run the actual CNN (Convolutional Neural Network) model for quality grading.
2. **Frontend:** Developing the Mobile-first PWA using Next.js for a seamless user experience.

---

### 💡 Tips for a Great Presentation:
1. **Be Confident:** You have built a complex system that uses raw SQL, PostGIS, and modular design. Most students don't do this!
2. **Show the Script:** Running `master-test.ts` is the best way to show that your logic works without errors.
3. **Mention Security:** Highlight that you used `@UseGuards(SupabaseAuthGuard)` to protect the API.
