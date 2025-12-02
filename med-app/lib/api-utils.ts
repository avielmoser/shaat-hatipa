import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse };

export async function validateRequest<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return {
        success: false,
        response: NextResponse.json(
          { error: "Invalid JSON body" },
          { status: 400 }
        ),
      };
    }

    const result = schema.safeParse(body);

    if (!result.success) {
      const errorMessage = result.error.issues
        .map((e: any) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");

      return {
        success: false,
        response: NextResponse.json(
          { error: `Validation Error: ${errorMessage}` },
          { status: 400 }
        ),
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Internal Server Error during validation" },
        { status: 500 }
      ),
    };
  }
}
