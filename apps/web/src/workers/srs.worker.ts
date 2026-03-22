import { calculateReview, CardState, SrsRating, ReviewResult } from '@fuxie/srs-engine'

// Define the incoming message format
export interface SrsCalculatePayload {
    cardId: string
    cardState: CardState
    rating: SrsRating
}

export interface SrsCalculateMessage {
    type: 'CALCULATE_REVIEW'
    payload: SrsCalculatePayload
}

// Define the outgoing message format
export interface SrsCalculateResponse {
    type: 'REVIEW_RESULT'
    payload: {
        cardId: string
        result: ReviewResult
    }
}

// Listen for messages from the main thread
self.addEventListener('message', (event: MessageEvent<SrsCalculateMessage>) => {
    if (event.data?.type === 'CALCULATE_REVIEW') {
        const { cardId, cardState, rating } = event.data.payload
        
        // Run the deterministic SM-2 computation
        const result = calculateReview(cardState, rating)
        
        // Post the result back to the main thread instantly
        const response: SrsCalculateResponse = {
            type: 'REVIEW_RESULT',
            payload: { cardId, result }
        }
        
        self.postMessage(response)
    }
})
