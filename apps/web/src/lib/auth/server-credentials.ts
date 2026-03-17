/**
 * Firebase service account credentials for server-side auth.
 *
 * NOTE: These are imported directly (not from env vars) because
 * Next.js Edge Runtime middleware cannot access process.env for
 * non-NEXT_PUBLIC_ variables. The .env file's server-only vars
 * are NOT available in Edge middleware context.
 *
 * In production, replace with proper secret management.
 */
export const serverCredentials = {
    serviceAccount: {
        projectId: 'dmf-elearning',
        clientEmail: 'firebase-adminsdk-fbsvc@dmf-elearning.iam.gserviceaccount.com',
        privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC6lchUvwu+/U5R\ncl4xu87SmLqaHyMKiiuIMDQudcOWG3t26sUVIYmJx5CMIutGrg+C2ueaksD18oL+\nktNnDIyD8PuLMKw0TEJDcU1Jg3N8xDBl9j5dSXmwLT5IBLP4O6yQUrys2M0IBCrP\nTEtkOKc8gMQ/RvGhW4EJA1opO187dZlJecTjeo0jnB7c49lXx7T2p7h42sy0nvjy\nYiLRKT0I8U/6IYJBlSo2LYYToEDs2yEZhHuUU9bJ4pv5n8dgyVBw0wO4xf3RORA/\nb5tSLEULrhrV+dpzOqRwXlxZdYMGDfhGYX39Yb+vQ478xZnuviZDLhovC03IhlIF\n6mm/gjXvAgMBAAECggEAB+DvQUotOswDae5ZtTaS+H2OfkI2U+mbBk3SxkDJbiXh\nmWyMaeStTsNognevAPW0nffps7M4BqqjhrsNxi+CIh144bBqdRg17BcgBldQocIU\nW8SBbvr9R8fWoL/iFudI1XHzmZuF/NgANBn/96QUxmSW5NJ1aDTZnAHSOs97qU0E\nIawjtrakkNxTOmS3wzpBARZpT37FZdcupB2lu1Qd9aR6oI05UU6LdRsNPI4vOWvD\nn1XeBkLOAk+5OLyVfNsjXgElbOGZ+zaKhnatamMSoqIJ459fvXe77o2hNYUytk81\ngdOYFCaQIwAeU1yD+F1sNYO5vBw8Xlq7oWTCiqyBoQKBgQDg2cRJcQJ9uexnjyaD\nUYOYFs2B7vHETr/BbnQzxJWAp1PcyuXwGEwyIstDx3HgjubE71aO1lLjQX0FdZL5\n3DNgxsqFe0HGWRPT5Nkdybh/H977Wtk2nHfhw5qRRvrdIA7FLcikwAc8dXx1IL+o\n6QALi2to5FyquCilED0NbXm2BwKBgQDUbvGbf9Gc31Xp3qxsaprNUSLTYQOndG88\n4lKI5FHASfRCToOdpRLAHCfivhS9xlXUE5fQHVVa6juxu3MItosvQ/r6Yh3C9Rsl\nUahTIKzJZufOGvzOUIy60OIoZhGJoveB8LeCHvOeCBu3K7+yh27dVEoxhdQHCodO\nOE7ya6dG2QKBgQDMBm2ookW7ZZhQg8FTiQSaXZ6OVw3Drh0rXJlOXAO4YJylDOrG\nCJYjLBU65F+9fo2BhxcItwsxMLxL1trNo/RuzRL5OdV+MFfgfphQAjlKCNZhR5cv\niZzyG3ZGepypRyx/2MJmU+R9BLIw6c1fbEThNNn6rLQ1KLOgy3JKm9rDwwKBgDZL\nPLkPjBVaB21EmjEDdhkvuYTo8LQl0CBxf8K5CCPrQuCHjKAIBqjPCWqsRkTSojEX\n6N8qABzCbQtZ62a4sQ4dg9HmrdCcMJnzKuBEI6U+BdTplN9uOumsZYEJxUW2PygY\ny+4X1w/25o6EQfRxJOawml3Z5H0ANeDKB3NyDEjRAoGBALNjrzpP+88IHGFltu/e\nOQJ5sYX5ifjWUQqQBfn/g/gqggv603I/lXTrcCSkoP3Verr4UQw6Tig1YsuUiX0a\ncNTqBTrbkCGVh3WHG970g8debcaOgGEmsml66+WiBrm7tywtQVRL1wYIEfFfqQ5+\nS7uLdkl1ixNzSvdRRPayG50V\n-----END PRIVATE KEY-----\n',
    },
    projectId: 'dmf-elearning',
    apiKey: 'AIzaSyBWLgTv4MCJmRaiSazubXTPTaPZNvGKamo',
}
