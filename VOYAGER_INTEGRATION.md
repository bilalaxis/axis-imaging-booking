# Voyager RIS Integration Guide

## Overview

This booking system integrates with Voyager RIS to fetch real-time availability and create appointments. The integration supports both REST API and HL7 messaging protocols.

## Environment Variables

Add these to your `.env` file:

```env
# Voyager RIS Integration
VOYAGER_API_URL="https://voyager-ris.example.com/api"
VOYAGER_USERNAME="your_username"
VOYAGER_PASSWORD="your_password"
VOYAGER_FACILITY_ID="AXIS"
```

## Integration Options

### Option 1: REST API Integration (Recommended)

If Voyager provides a REST API, the system will use it for:
- Fetching real-time availability
- Creating appointments
- Updating appointment status

**Required API Endpoints:**
- `POST /api/availability` - Get available time slots
- `POST /api/appointments` - Create new appointment

### Option 2: HL7 Messaging

If Voyager only supports HL7, the system will:
- Generate HL7 SIU^S12 messages for appointment creation
- Send via MLLP (Minimal Lower Layer Protocol)
- Handle acknowledgments and responses

**Required HL7 Messages:**
- SIU^S12 - Schedule Request
- SIU^S13 - Schedule Response

## Scan Duration Management

### Database Schema

Scan durations are managed in the `Service` model:

```prisma
model Service {
  id              String    @id @default(uuid())
  name            String
  durationMinutes Int       @default(30) // Duration in minutes
  // ... other fields
}
```

### Setting Up Service Durations

1. **Via Database Seed:**
   ```typescript
   // In prisma/seed.ts
   await prisma.service.create({
     data: {
       name: "CT Scan - Chest",
       durationMinutes: 45,
       category: "CT"
     }
   })
   ```

2. **Via Admin Interface:**
   - Create an admin panel to manage service durations
   - Allow real-time updates without code changes

3. **Via Voyager Sync:**
   - Fetch service configurations from Voyager
   - Sync durations automatically

### Duration Considerations

- **Standard Durations:**
  - X-Ray: 15-30 minutes
  - CT Scan: 30-60 minutes
  - MRI: 45-90 minutes
  - Ultrasound: 30-45 minutes

- **Variable Factors:**
  - Body part complexity
  - Patient preparation needs
  - Equipment setup time
  - Radiologist availability

## Availability Flow

1. **User selects service** → System fetches service duration
2. **User selects body part** → System may adjust duration based on complexity
3. **System requests availability** → Voyager returns available slots
4. **User selects time** → System validates slot availability
5. **Booking submission** → Creates appointment in both systems

## Error Handling

### Voyager Unavailable
- System falls back to local availability slots
- Appointments marked as "pending"
- Manual processing required for confirmation

### Duration Conflicts
- System validates slot duration against service requirements
- Prevents double-booking by checking existing appointments
- Handles partial slot conflicts

## Testing the Integration

### Local Development
```bash
# Set up test Voyager credentials
VOYAGER_API_URL="http://localhost:8080/api"
VOYAGER_USERNAME="test"
VOYAGER_PASSWORD="test"

# Test availability endpoint
curl -X GET "http://localhost:3000/api/availability?service_id=xxx&date_from=2024-01-01"
```

### Production Deployment
1. Configure production Voyager credentials
2. Test with small date ranges first
3. Monitor error logs for integration issues
4. Set up alerts for Voyager connectivity problems

## Monitoring and Maintenance

### Health Checks
- Regular availability endpoint testing
- Appointment creation success rate monitoring
- HL7 message delivery tracking

### Troubleshooting
- Check Voyager API connectivity
- Verify authentication credentials
- Review HL7 message formatting
- Monitor database transaction logs

## Security Considerations

- Use HTTPS for all Voyager API calls
- Store credentials securely (use Vercel environment variables)
- Implement request rate limiting
- Log all integration activities for audit
- Validate all data from Voyager before processing 