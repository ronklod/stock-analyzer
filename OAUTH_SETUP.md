# Setting up Google OAuth for Stock Analyzer

## 1. Create a Google OAuth 2.0 Client

1. Visit the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application" as the application type
6. Add a name for your OAuth client
7. Add the following authorized redirect URIs:
   - `http://localhost:5001/api/auth/google/callback`
   - `https://your-production-domain.com/api/auth/google/callback` (if applicable)
8. Click "Create"
9. Note down your Client ID and Client Secret

## 2. Configure the Environment Variables

1. Open the `.env` file in the root directory of the project
2. Replace the placeholder values with your actual Google OAuth credentials:

```
SECRET_KEY=a302565f9cc030fff24c00746766a10f4b067de5ae6bc7066d9e9494a075e2b5
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5001/api/auth/google/callback
```

## 3. Run the Application

```bash
./run_webapp_auth.sh
```

## Security Notes

- Never commit your `.env` file with real credentials to version control
- For production, store your credentials in a secure environment variable management system
- Regularly rotate your OAuth client secrets for enhanced security
