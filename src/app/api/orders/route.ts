
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/orders";

// GET: Fetch all customer orders
export async function GET() {
  try {
    await connectDB();

    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Admin fetch orders error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch orders.",
      },
      { status: 500 }
    );
  }
}

// PATCH: Update order status
export async function PATCH(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const orderId = String(body.orderId || "").trim();
    const status = String(body.status || "").trim();

    const allowedStatuses = [
      "Pending",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    if (!orderId || !status) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID and status are required.",
        },
        { status: 400 }
      );
    }

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order status.",
        },
        { status: 400 }
      );
    }

    const order = await Order.findOneAndUpdate(
      { orderId },
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully.",
      order,
    });
  } catch (error) {
    console.error("Admin update order error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update order status.",
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete all test orders
export async function DELETE() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        success: false,
        message: "Order reset is disabled in production.",
      },
      { status: 403 }
    );
  }

  try {
    await connectDB();

    const result = await Order.deleteMany({});

    return NextResponse.json({
      success: true,
      message: "All test orders deleted successfully.",
      ordersDeleted: result.deletedCount,
    });
  } catch (error) {
    console.error("Delete orders error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete orders.",
      },
      { status: 500 }
    );
  }
}
