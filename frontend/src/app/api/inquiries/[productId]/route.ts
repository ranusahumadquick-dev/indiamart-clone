import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    // Await params (required in Next.js 15+)
    const { productId } = await params;

    // Get auth token from headers or cookies
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      console.warn('⚠️ No auth token provided');
      return NextResponse.json(
        { success: false, message: 'Please login to send an inquiry' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { subject, quantityRequired, message } = body;

    // Validate required fields
    if (!productId) {
      console.error('❌ Product ID is missing');
      return NextResponse.json(
        { success: false, message: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (!message) {
      console.error('❌ Message is required');
      return NextResponse.json(
        { success: false, message: 'Message is required' },
        { status: 400 }
      );
    }

    console.log('📨 Creating inquiry for product:', productId, 'from user with token ending in:', token.substring(token.length - 10));

    // Call backend API with proper headers
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:3004';
    const backendResponse = await fetch(
      `${backendUrl}/api/inquiries/${productId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: subject || 'Product Inquiry',
          quantityRequired: parseInt(quantityRequired) || 1,
          message: message,
        }),
      }
    );

    const backendData = await backendResponse.json();

    console.log('✅ Backend response:', {
      status: backendResponse.status,
      success: backendData.success,
      message: backendData.message,
    });

    if (!backendResponse.ok) {
      console.error('❌ Backend error:', backendData);
      return NextResponse.json(
        {
          success: false,
          message: backendData.message || backendData.error || 'Failed to create inquiry',
        },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Inquiry sent successfully!', data: backendData.data },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Inquiry API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send inquiry',
      },
      { status: 500 }
    );
  }
}
