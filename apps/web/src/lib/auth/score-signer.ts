import crypto from 'crypto';

export function signScore(lessonId: string, score: number): string {
    const secret = process.env.AUTH_SECRET || 'fuxie-default-secret';
    return crypto.createHmac('sha256', secret).update(`${lessonId}:${score}`).digest('hex');
}

export function verifyScore(lessonId: string, score: number, signature: string): boolean {
    const expected = signScore(lessonId, score);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
