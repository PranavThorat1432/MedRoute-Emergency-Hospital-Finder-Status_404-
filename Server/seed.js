require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Hospital = require("./models/Hospital");
const Admin = require("./models/Admin");

const hospitals = [
  {
    name: "Civil Hospital Jalgaon",
    city: "Jalgaon",
    address: "Jilha Peth, Old BJ Market, Jalgaon, Maharashtra 425001",
    phone: "0257-2226611",
    email: "civilhospitaljalgaon@gmail.com",
    lat: 21.0085,
    lng: 75.5639,
    emergency: true,
    specialities: ["General Medicine", "Surgery", "Orthopedics", "ICU"],
    beds: { total: 300, available: 51 },
    icu: { total: 32, available: 7 },
    ventilators: { total: 18, available: 4 },
    emergencySlots: { total: 20, available: 6 },
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800",
  },

  {
    name: "Orchid Multi Superspeciality Hospital",
    city: "Jalgaon",
    address: "Opp RR High School, Jilha Peth, Jalgaon",
    phone: "0257-2229749",
    email: "info@orchidhospital.in",
    lat: 21.0058,
    lng: 75.5607,
    emergency: true,
    specialities: ["Cardiology", "Neurology", "Trauma", "ICU"],
    beds: { total: 110, available: 23 },
    icu: { total: 18, available: 5 },
    ventilators: { total: 10, available: 2 },
    emergencySlots: { total: 10, available: 3 },
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800",
  },

  {
    name: "Vanita Multispeciality Hospital",
    city: "Jalgaon",
    address: "34 Ring Road, Pratap Nagar, Jalgaon",
    phone: "0257-2994001",
    email: "info@vanitahospitals.com",
    lat: 21.0141,
    lng: 75.5742,
    emergency: true,
    specialities: ["Emergency", "Cardiology", "General Surgery"],
    beds: { total: 95, available: 17 },
    icu: { total: 15, available: 4 },
    ventilators: { total: 8, available: 2 },
    emergencySlots: { total: 8, available: 2 },
    image: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800",
  },

  {
    name: "RL Hospital",
    city: "Jalgaon",
    address: "Nivrutti Nagar, NH6, Jalgaon",
    phone: "9421451854",
    email: "contact@rlhospital.in",
    lat: 21.0181,
    lng: 75.5528,
    emergency: true,
    specialities: ["Orthopedic", "Neurosurgery", "Critical Care"],
    beds: { total: 90, available: 19 },
    icu: { total: 14, available: 3 },
    ventilators: { total: 7, available: 2 },
    emergencySlots: { total: 10, available: 4 },
    image: "https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?w=800",
  },

  {
    name: "Siddhivinayak Hospital",
    city: "Jalgaon",
    address: "NH53 Near Icchadevi Mandir, Jalgaon",
    phone: "0257-2235991",
    email: "siddhivinayakhospital@gmail.com",
    lat: 21.0194,
    lng: 75.5712,
    emergency: true,
    specialities: ["Gynecology", "Pediatrics", "NICU"],
    beds: { total: 75, available: 15 },
    icu: { total: 10, available: 2 },
    ventilators: { total: 5, available: 1 },
    emergencySlots: { total: 7, available: 2 },
    image: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800",
  },

  {
    name: "NUCLEUS Hospital",
    city: "Jalgaon",
    address: "Near MJ College, Ramanand Nagar, Jalgaon",
    phone: "0257-2222452",
    email: "nucleushospital@gmail.com",
    lat: 21.0119,
    lng: 75.5582,
    emergency: true,
    specialities: ["General Surgery", "ICU", "Trauma"],
    beds: { total: 85, available: 20 },
    icu: { total: 12, available: 4 },
    ventilators: { total: 6, available: 1 },
    emergencySlots: { total: 8, available: 3 },
    image: "https://images.unsplash.com/photo-1580281657702-257584239a55?w=800",
  },

  {
    name: "Arogyadeep Hospital",
    city: "Jalgaon",
    address: "Ring Road, Near Samaj Kalyan Office, Jalgaon",
    phone: "0257-2237255",
    email: "arogyadeep@gmail.com",
    lat: 21.0104,
    lng: 75.5541,
    emergency: true,
    specialities: ["General Medicine", "Emergency", "ICU"],
    beds: { total: 70, available: 18 },
    icu: { total: 9, available: 2 },
    ventilators: { total: 4, available: 1 },
    emergencySlots: { total: 6, available: 2 },
    image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800",
  },

  {
    name: "Sadhana Hospital",
    city: "Jalgaon",
    address: "Opp Ambedkar Market, Vivekanand Nagar, Jalgaon",
    phone: "0257-2953375",
    email: "sadhanahospital@gmail.com",
    lat: 21.0067,
    lng: 75.5695,
    emergency: true,
    specialities: ["General Surgery", "Orthopedics"],
    beds: { total: 60, available: 14 },
    icu: { total: 8, available: 2 },
    ventilators: { total: 4, available: 1 },
    emergencySlots: { total: 5, available: 2 },
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800",
  },

  {
    name: "Matrusparsha Hospital",
    city: "Jalgaon",
    address: "Ganesh Colony, Jalgaon",
    phone: "8788909039",
    email: "matrusparsha@gmail.com",
    lat: 21.0128,
    lng: 75.5675,
    emergency: true,
    specialities: ["Maternity", "Gynecology", "Pediatrics"],
    beds: { total: 55, available: 11 },
    icu: { total: 6, available: 2 },
    ventilators: { total: 3, available: 1 },
    emergencySlots: { total: 4, available: 1 },
    image: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800",
  },

  {
    name: "Sarode Multispeciality Hospital",
    city: "Jalgaon",
    address: "Ganesh Colony Chowk, Jalgaon",
    phone: "7378648237",
    email: "sarodehospital@gmail.com",
    lat: 21.0145,
    lng: 75.5669,
    emergency: false,
    specialities: ["ENT", "Ophthalmology"],
    beds: { total: 40, available: 12 },
    icu: { total: 4, available: 1 },
    ventilators: { total: 2, available: 1 },
    emergencySlots: { total: 0, available: 0 },
    image: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800",
  },

  {
    name: "Shobha Hospital",
    city: "Jalgaon",
    address: "Sindhi Colony Road, Jalgaon",
    phone: "9021559329",
    email: "shobhahospital@gmail.com",
    lat: 21.017,
    lng: 75.5692,
    emergency: true,
    specialities: ["Gastroenterology", "ICU"],
    beds: { total: 68, available: 16 },
    icu: { total: 9, available: 3 },
    ventilators: { total: 5, available: 1 },
    emergencySlots: { total: 6, available: 2 },
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800",
  },

  {
    name: "Chinmay Hospital",
    city: "Jalgaon",
    address: "Onkar Nagar Chowk, Jalgaon",
    phone: "0257-2234407",
    email: "chinmayhospital@gmail.com",
    lat: 21.0082,
    lng: 75.5621,
    emergency: true,
    specialities: ["Critical Care", "General Medicine"],
    beds: { total: 52, available: 10 },
    icu: { total: 7, available: 2 },
    ventilators: { total: 3, available: 1 },
    emergencySlots: { total: 4, available: 1 },
    image: "https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?w=800",
  },

  {
    name: "Khushi Hospital",
    city: "Jalgaon",
    address: "Pratap Nagar, Jalgaon",
    phone: "9225306774",
    email: "khushihospital@gmail.com",
    lat: 21.0133,
    lng: 75.5715,
    emergency: true,
    specialities: ["Cancer Care", "Laparoscopy"],
    beds: { total: 72, available: 15 },
    icu: { total: 10, available: 2 },
    ventilators: { total: 5, available: 1 },
    emergencySlots: { total: 6, available: 2 },
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800",
  },

  {
    name: "Aditya Hospital",
    city: "Jalgaon",
    address: "Deshpande Market, Pimprala, Jalgaon",
    phone: "0257-2234567",
    email: "adityahospital@gmail.com",
    lat: 21.0163,
    lng: 75.5374,
    emergency: false,
    specialities: ["General Surgery", "Medicine"],
    beds: { total: 45, available: 11 },
    icu: { total: 5, available: 1 },
    ventilators: { total: 2, available: 1 },
    emergencySlots: { total: 0, available: 0 },
    image: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800",
  },
  {
    name: "Godavari Hospital",
    city: "Jalgaon",
    address: "MIDC Area, Jalgaon - 425003",
    phone: "0257-2238000",
    email: "care@godavarihospital.com",
    lat: 20.9998,
    lng: 75.555,
    emergency: true,
    specialities: ["Emergency Care", "Trauma Surgery", "Internal Medicine"],
    beds: { total: 100, available: 18 },
    icu: { total: 15, available: 3 },
    ventilators: { total: 8, available: 1 },
    emergencySlots: { total: 12, available: 5 },
    bloodInventory: [
      { group: "O-", units: 3 },
      { group: "AB+", units: 2 },
    ],
    image:
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=500&fit=crop",
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB Atlas");

    await Hospital.deleteMany();
    console.log("🗑️  Cleared existing hospitals");

    await Hospital.insertMany(hospitals);
    console.log(`✅ Seeded ${hospitals.length} Jalgaon hospitals`);

    // Create admin if not exists
    await Admin.deleteMany();
    const admin = await Admin.create({
      username: "admin",
      password: "medroute2024",
    });
    console.log(`✅ Admin created — username: admin | password: medroute2024`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err.message);
    process.exit(1);
  }
}

seed();
