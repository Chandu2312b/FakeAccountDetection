# MongoDB Atlas Setup Instructions

## 1. Create .env File

Create a `.env` file in the `backend` directory with the following content:

```env
# MongoDB Atlas Connection String
# Replace with your actual MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fakeaccount?retryWrites=true&w=majority

# Server Configuration
PORT=4000
CORS_ORIGIN=http://localhost:5173

# Environment
NODE_ENV=development
```

## 2. MongoDB Atlas Connection String Format

Your MongoDB Atlas connection string should look like this:
```
mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/<database-name>?retryWrites=true&w=majority
```

### Example:
```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/fakeaccount?retryWrites=true&w=majority
```

## 3. Getting Your MongoDB Atlas Connection String

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Go to your cluster
3. Click "Connect"
4. Choose "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database user password
7. Replace `<database-name>` with `fakeaccount` (or your preferred database name)

## 4. Database User Setup

Make sure you have a database user with read/write permissions:

1. In MongoDB Atlas, go to "Database Access"
2. Create a new user or use existing user
3. Set password and ensure user has "Read and write to any database" permissions

## 5. Network Access

Ensure your IP address is whitelisted:

1. In MongoDB Atlas, go to "Network Access"
2. Add your current IP address or use `0.0.0.0/0` for development (not recommended for production)

## 6. Test the Connection

Run the test script to verify everything is working:

```bash
cd backend
node test-connection.js
```

## 7. Start the Server

```bash
cd backend
npm run dev
```

## 8. API Endpoints

Once connected, you can use these endpoints:

### Scan an Account
```bash
POST /api/accounts/scan
Content-Type: application/json

{
  "accountId": "user123",
  "username": "testuser",
  "follower_count": 1000,
  "posts_count": 50,
  "following_count": 200,
  "account_age_days": 365,
  "sample_post": "This is a sample post"
}
```

### Get Account Details
```bash
GET /api/accounts/user123
```

### Get Scan History
```bash
GET /api/accounts/user123/scans?limit=10&offset=0
```

### Get All Accounts (with filtering)
```bash
GET /api/accounts?page=1&limit=20&riskCategory=Suspicious&minTrustScore=50
```

## 9. Database Collections

The application will create these collections automatically:

- **accounts**: Stores account information and scan results
- **events**: Stores activity events and scan logs
- **flags**: Stores flagged accounts for admin review
- **reports**: Stores user reports
- **honeypots**: Stores honeypot interaction data

## 10. Troubleshooting

### Connection Issues
- Verify your connection string is correct
- Check that your IP is whitelisted
- Ensure database user has proper permissions
- Check if your cluster is running

### Environment Variables
- Make sure `.env` file is in the `backend` directory
- Verify no extra spaces or quotes in the connection string
- Check that `dotenv` is properly configured

### Common Errors
- `MongoServerError: Authentication failed` - Check username/password
- `MongoServerError: IP not in whitelist` - Add your IP to network access
- `MongooseError: Operation buffering timed out` - Check connection string format

## 11. Production Considerations

For production deployment:

1. Use environment-specific connection strings
2. Set up proper IP whitelisting
3. Use database users with minimal required permissions
4. Enable SSL/TLS
5. Set up monitoring and alerts
6. Regular backups

## 12. Data Storage Details

Every manual scan will store:

- **Account Information**: Basic profile data
- **Scan Results**: Trust score, risk category, reasons, evidence
- **Scan History**: Complete history of all scans with timestamps
- **Client Information**: IP address, user agent, source
- **Event Logs**: Activity tracking for analytics

This ensures complete traceability and audit trail for all account scans.

