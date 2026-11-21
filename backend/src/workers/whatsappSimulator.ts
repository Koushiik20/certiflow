/**
 * WhatsApp Delivery Simulator
 * Simulates real-world delivery behaviors:
 * - Temporary failures (network timeout, rate limit)
 * - Random network jitter
 * - Permanent failure (invalid/unregistered phone numbers)
 * - Exponential backoff retry verification
 */

export interface WhatsAppSimulationResult {
  success: boolean;
  failureType: 'NONE' | 'TEMPORARY' | 'TIMEOUT' | 'PERMANENT' | 'RANDOM';
  errorDetails?: string;
  statusCode: number;
}

export class WhatsAppSimulator {
  /**
   * Simulates sending a WhatsApp message with an attachment (PDF Certificate)
   */
  public static async sendMessage(
    phoneNumber: string,
    messageText: string,
    certificateUrl: string,
    attemptNumber: number
  ): Promise<WhatsAppSimulationResult> {
    // Artificial slight network latency (50ms - 200ms)
    await new Promise((res) => setTimeout(res, 80));

    // 1. Permanent Failure: Phone numbers ending with '0000' or designated test invalid numbers
    if (phoneNumber.endsWith('0000') || phoneNumber === '9999999999') {
      return {
        success: false,
        failureType: 'PERMANENT',
        errorDetails: 'WhatsApp API error 131026: Phone number is not registered on WhatsApp or account deleted.',
        statusCode: 400
      };
    }

    // 2. Simulated Timeout: Phone numbers ending with '5555'
    if (phoneNumber.endsWith('5555') && attemptNumber === 1) {
      return {
        success: false,
        failureType: 'TIMEOUT',
        errorDetails: 'Gateway Timeout (504): WhatsApp upstream webhook did not acknowledge within 30000ms.',
        statusCode: 504
      };
    }

    // 3. Simulated Temporary Failure: Phone numbers ending with '1111' fail on attempt 1, succeed on retry
    if (phoneNumber.endsWith('1111') && attemptNumber < 2) {
      return {
        success: false,
        failureType: 'TEMPORARY',
        errorDetails: 'WhatsApp API error 131000: Rate limit exceeded or transient network blip. Retry with backoff.',
        statusCode: 429
      };
    }

    // 4. Random Flakiness for demo realism (only 5% chance if none of above)
    // If phone number has 9876543299, intentionally fail 2 times then succeed
    if (phoneNumber.endsWith('3299') && attemptNumber < 3) {
      return {
        success: false,
        failureType: 'RANDOM',
        errorDetails: `Upstream WhatsApp Node server returned temporary 503 Service Unavailable (Attempt ${attemptNumber}).`,
        statusCode: 503
      };
    }

    // Successful Delivery
    return {
      success: true,
      failureType: 'NONE',
      statusCode: 200
    };
  }
}

