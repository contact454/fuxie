/**
 * Firebase service account credentials for server-side auth.
 *
 * Uses environment variables for production deployment.
 * Falls back to inline credentials for local development.
 *
 * NOTE: Edge Runtime middleware CAN access env vars if they are
 * explicitly exposed in next.config.ts env{} block.
 */

function getServiceAccount() {
    const envKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (envKey) {
        try {
            const parsed = JSON.parse(envKey)
            return {
                projectId: parsed.project_id,
                clientEmail: parsed.client_email,
                privateKey: parsed.private_key,
            }
        } catch {
            console.error('[Fuxie] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY')
        }
    }

    // Fallback for local development
    return {
        projectId: 'fuxie-490502',
        clientEmail: 'firebase-adminsdk-fbsvc@fuxie-490502.iam.gserviceaccount.com',
        privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDDy3yaC1s+xdGD\nT7/Ioqhin58apzYaUW/b6/YoToEjngg86Kzve7cfulUmvtldiZS9t9CrhdxdjSY1\nC4Mgju7FrWk/f6PZWb//YJx0b/8qirB2DSy6k9vkNi+FUlPbJz9v2/APVvvCBae4\nf7dkLqk4xxWqrwFFp+xO/cgR/JeP5hl5Q4JL1XMQjfewzW5vYb2dk/ppxm9m571G\nPgdwsaRawz8PkgIT9a7G8bXwt8Pdv+W4ndNzeb1HwVD91vb49HkhoZ2TvWYFPrAe\n+tDxwEuYRsFHZefEhT5Ublrqj1i3hPVPlvKOD8qcKdFXuSkzg1KIUqi7nriTMEmg\nqNd7tCRbAgMBAAECggEAFBsvXnpQEnAqBbwIy8e4VvhhVFFbgvRd8k2W56i4Jjoy\nSl7yc11W/tEZsXLjy3E3bwwTR6nlaU33YHcgLhW/e1lFd5nZ75YB223GY0alA29e\nk6DiuP46FINj+eLsbZLoNsp1Kn4aOGBwSsgCwyzvf78iAHccQFTwNWRmSUKRJduj\nOzKfrr8RGPM5ek6Lad2KtgChwoFEkDy1WoCH3KayMO+s4PK4fVUkLUwBsMLBcblv\nKcVnHV518oDF/lqwFtgPHAUPTd5oysYLkTq+GLoDd7ZMra4VsogtrYq2pm7+Edbx\nXUlMFebk7C+rEfXOfYUfqn+qJ8D689QghZ1xEATkcQKBgQDoBf1F+9WaFEl/RnQx\nyT6lWmnisxd+yi2/V1eQkl8yqlxiBVZHTN+5fEGO0xNjC7dllgqPKev21AN/nQe9\nSVfseHI3o39674WyjF/T0fZFwjlPwm2jyhkcqsS3+TITvGfShfuh9/C0UqXaOaCW\nNcCJZVvDHm7mKbJFZgmWDOIQNQKBgQDYBxkWmiVviqv+ySPXX+GleqZV+kbm0Svl\nKXvxO1fjvi1HrTTAe0AzIDrhUuEUfybSVCf2z7G1ra9YJOkmm7/tWiJqKdffoNYK\nADiSBw9SYVvdPt+j42At6/y0oA0kFXlfLyUJ3XHT6B02lIPTdE3PUC4HL6sdxh0B\nMhpSpZkUTwKBgFVXBp48D4e5mILovgol1BXrmHCaoLSw1ny/OmThgYRYJtyiy+Yz\nv0IxEsfemQ3gHFeQBVg8+h5yQssoTdVwaZd/gbs3NsdX3BwdB44YdvWXh47vm3YX\n+n6RzQNB9ApQTPug7jnXwUAB+iC2+3rkUGn4zvSIeA/OHFTsP/Bh0rBVAoGAdr6w\nE7R3j3BySoLVqLWTmxpoBCqmfonLzxOWhWtRTGZlDVkv/f3BtFirBOBByLp75HFN\n5mUUEgF+uLzRS9+hCB7be++0McB+5tBoSByJV4ccr+i3laaOX6+wILk5f/Qt2xxX\nB60pvImCRVYtgDYV7zbrlhelv5/+oYGg5n0QQBECgYEA1UQQTcgmX+QhUupomrSX\nAsuqwp5XCWQ0vUYrLrVieoCMUSbDke3W6qADD2bFXgt+WiyXHeeNL30aHnh+Dzt+\n6/bsXI7lZEyUhR2ShA9CcpgCt6IaZDsP6MIIAEePBBZN+HCADLuBliczEFgZrFnZ\n9MflATGLwzRWnWcJXa742R0=\n-----END PRIVATE KEY-----\n',
    }
}

export const serverCredentials = {
    serviceAccount: getServiceAccount(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'fuxie-490502',
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDs4bD5V4AHZLXIKi5Qs7n2ggP9KSh_fs8',
}
