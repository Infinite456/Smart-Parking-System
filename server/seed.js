const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const ParkingFacility = require('./models/ParkingFacility');
const ParkingSlot = require('./models/ParkingSlot');
const Reservation = require('./models/Reservation');
const ParkingSession = require('./models/ParkingSession');
const Violation = require('./models/Violation');
const PricingRule = require('./models/PricingRule');
const Prediction = require('./models/Prediction');
const EVChargingSession = require('./models/EVChargingSession');

dotenv.config();

const connectDB = require('./config/db');

const seedData = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await connectDB();

    // 1. Clear existing data
    console.log('Clearing existing database collections...');
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await ParkingFacility.deleteMany({});
    await ParkingSlot.deleteMany({});
    await Reservation.deleteMany({});
    await ParkingSession.deleteMany({});
    await Violation.deleteMany({});
    await PricingRule.deleteMany({});
    await Prediction.deleteMany({});
    await EVChargingSession.deleteMany({});
    console.log('Collections cleared.');

    // 2. Create Users (passwords are hashed in User pre-save hook)
    console.log('Seeding Users...');
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@parking.com',
      passwordHash: 'admin123',
      role: 'admin',
      phone: '+919999988888',
    });

    const user1 = await User.create({
      name: 'John Doe',
      email: 'john@parking.com',
      passwordHash: 'user123',
      role: 'user',
      phone: '+919876543210',
    });

    const user2 = await User.create({
      name: 'Jane Smith',
      email: 'jane@parking.com',
      passwordHash: 'user123',
      role: 'user',
      phone: '+919876543211',
    });

    const user3 = await User.create({
      name: 'Bob EV Rider',
      email: 'bob@parking.com',
      passwordHash: 'user123',
      role: 'user',
      phone: '+919876543212',
    });
    console.log(`Seeded ${User.length} users.`);

    // 3. Create Vehicles
    console.log('Seeding Vehicles...');
    const v1 = await Vehicle.create({
      userId: user1._id,
      registrationNumber: 'MH-12-AB-1234',
      type: 'Car',
      size: 'medium',
      isEV: false,
    });

    const v2 = await Vehicle.create({
      userId: user1._id,
      registrationNumber: 'MH-12-CD-5678',
      type: 'Motorcycle',
      size: 'small',
      isEV: false,
    });

    const v3 = await Vehicle.create({
      userId: user2._id,
      registrationNumber: 'DL-01-XY-9876',
      type: 'SUV',
      size: 'large',
      isEV: false,
    });

    const v4 = await Vehicle.create({
      userId: user3._id,
      registrationNumber: 'KA-51-EV-4321',
      type: 'Car',
      size: 'medium',
      isEV: true,
      batteryLevel: 35,
    });

    const v5 = await Vehicle.create({
      userId: user3._id,
      registrationNumber: 'MH-14-EV-9999',
      type: 'Van',
      size: 'large',
      isEV: true,
      batteryLevel: 20,
    });
    console.log('Seeded vehicles.');

    // 4. Create Parking Facility
    console.log('Seeding Parking Facility...');
    const facility = await ParkingFacility.create({
      name: 'Downtown Smart Parking Hub',
      location: '12 Civic Center Blvd, Sector 4, Metro City',
      totalSlots: 50,
      operatingHours: '24/7',
    });
    console.log('Seeded facility.');

    // 5. Create Pricing Rules
    console.log('Seeding Pricing Rules...');
    await PricingRule.create([
      {
        facilityId: facility._id,
        occupancyRange: { min: 0, max: 50 },
        priceMultiplier: 1.0,
        peakHour: false,
        active: true,
      },
      {
        facilityId: facility._id,
        occupancyRange: { min: 51, max: 85 },
        priceMultiplier: 1.25,
        peakHour: false,
        active: true,
      },
      {
        facilityId: facility._id,
        occupancyRange: { min: 86, max: 100 },
        priceMultiplier: 1.6,
        peakHour: false,
        active: true,
      },
    ]);
    console.log('Seeded pricing rules.');

    // 6. Create 50 Parking Slots in Grid Layout (5 rows, 10 columns)
    console.log('Seeding 50 Slots...');
    const slots = [];
    
    // Rows mapping:
    // Row A: 1-10 -> Car slots, size medium
    // Row B: 1-10 -> SUV slots, size large (B-01 to B-08 form the emergency corridor)
    // Row C: 1-10 -> EV Charging slots, size medium, isEV true
    // Row D: 1-10 -> Motorcycle slots, size small
    // Row E: 1-10 -> Mixed slots (E-01..E-05 Van size large, E-06..E-10 Car size medium)

    const rowData = [
      { row: 'A', type: 'Car', size: 'medium', isEV: false },
      { row: 'B', type: 'SUV', size: 'large', isEV: false },
      { row: 'C', type: 'Car', size: 'medium', isEV: true },
      { row: 'D', type: 'Motorcycle', size: 'small', isEV: false },
      { row: 'E', type: 'Van', size: 'large', isEV: false },
    ];

    for (let r = 0; r < rowData.length; r++) {
      const { row, type, size, isEV } = rowData[r];
      for (let c = 1; c <= 10; c++) {
        const slotNumber = `${row}-${c.toString().padStart(2, '0')}`;
        
        // Coordinates for layout: x from 40 to 400, y from 50 to 250
        const x = c * 40 + 20;
        const y = (r + 1) * 60;

        // Customise type/size for split Row E
        let finalType = type;
        let finalSize = size;
        if (row === 'E' && c > 5) {
          finalType = 'Car';
          finalSize = 'medium';
        }

        // Set status: mock some occupied/reserved/maintenance slots for realism
        let status = 'Available';
        if (isEV) {
          status = c === 3 ? 'EV Charging' : c === 5 ? 'Reserved' : 'Available';
        } else {
          status = c === 2 || c === 7 ? 'Occupied' : c === 9 ? 'Maintenance' : 'Available';
        }

        slots.push({
          facilityId: facility._id,
          slotNumber,
          status,
          vehicleType: finalType,
          vehicleSize: finalSize,
          isEV,
          isAccessible: c === 1,
          coordinates: { x, y }
        });
      }
    }

    const insertedSlots = await ParkingSlot.insertMany(slots);
    console.log(`Seeded ${insertedSlots.length} parking slots.`);

    // 7. Seed active / past sessions, reservations, and violations
    console.log('Seeding Sample Reservations, Sessions, & Violations...');
    
    // Select slot A-02 and set occupied for a session
    const slotA02 = insertedSlots.find(s => s.slotNumber === 'A-02');
    slotA02.status = 'Occupied';
    await slotA02.save();

    const activeSession = await ParkingSession.create({
      userId: user1._id,
      vehicleId: v1._id,
      slotId: slotA02._id,
      entryTime: new Date(Date.now() - 2.5 * 60 * 60 * 1000), // 2.5 hours ago
      status: 'Active',
    });

    // EV slot C-03 charging session
    const slotC03 = insertedSlots.find(s => s.slotNumber === 'C-03');
    const evSession = await EVChargingSession.create({
      userId: user3._id,
      vehicleId: v4._id,
      slotId: slotC03._id,
      startTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      batteryBefore: 35,
      status: 'Charging',
    });
    
    await ParkingSession.create({
      userId: user3._id,
      vehicleId: v4._id,
      slotId: slotC03._id,
      entryTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
      status: 'Active'
    });

    // Completed sessions (history)
    const slotA05 = insertedSlots.find(s => s.slotNumber === 'A-05');
    await ParkingSession.create({
      userId: user1._id,
      vehicleId: v2._id,
      slotId: slotA05._id,
      entryTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
      exitTime: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
      duration: 90, // 1.5 hours
      amount: 60,
      status: 'Completed'
    });

    // Active reservation on Slot C-05
    const slotC05 = insertedSlots.find(s => s.slotNumber === 'C-05');
    const reservation = await Reservation.create({
      userId: user3._id,
      vehicleId: v5._id,
      facilityId: facility._id,
      slotId: slotC05._id,
      startTime: new Date(Date.now() + 1 * 60 * 60 * 1000), // in 1 hour
      endTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours duration
      status: 'Pending',
      price: 120,
    });

    // Seed a violation: ICE car v3 parked in EV slot C-08
    const slotC08 = insertedSlots.find(s => s.slotNumber === 'C-08');
    slotC08.status = 'Occupied';
    await slotC08.save();

    await Violation.create({
      userId: user2._id,
      vehicleId: v3._id,
      registrationNumber: v3.registrationNumber,
      slotId: slotC08._id,
      type: 'Unauthorized EV Charging Slot',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
      status: 'Active'
    });

    // Seed some historical prediction data
    console.log('Seeding Prediction curves...');
    const now = new Date();
    const mockPredictions = [];
    for (let i = 0; i < 24; i++) {
      const time = new Date(now.getTime() + i * 60 * 60 * 1000);
      const hour = time.getHours();
      let occupancy = 25;
      
      if (hour >= 8 && hour <= 10) occupancy = 78;
      else if (hour > 10 && hour < 17) occupancy = 55;
      else if (hour >= 17 && hour <= 20) occupancy = 88;
      else if (hour > 20) occupancy = 45;

      mockPredictions.push({
        facilityId: facility._id,
        timestamp: time,
        predictedOccupancy: occupancy,
        predictedAvailableSlots: Math.round(50 * (1 - occupancy / 100))
      });
    }
    await Prediction.insertMany(mockPredictions);

    console.log('\x1b[32m[Database Seeding Complete!] Database is ready.\x1b[0m');
    console.log('\nDemo User Credentials:\n------------------------');
    console.log('Admin Account:   admin@parking.com / admin123');
    console.log('User Account 1:  john@parking.com  / user123');
    console.log('User Account 2:  jane@parking.com  / user123');
    console.log('EV User Account: bob@parking.com   / user123\n');

    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error('\x1b[31m[Seeding Failed]\x1b[0m', error);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  seedData();
}

module.exports = { seedData };
