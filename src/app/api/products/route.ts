
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/product";

// GET: Fetch all products
export async function GET() {
  try {
    await connectDB();

    const products = await Product.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Fetch products error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST: Add a new product
export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      name,
      category,
      imageUrl,
      mrp,
      discountPercent,
      sellingPrice,
      description,
      stock,
      currency,
      badge,
    } = body;

    if (
      !name?.trim() ||
      !category ||
      mrp === undefined ||
      sellingPrice === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, category, MRP and selling price are required",
        },
        { status: 400 }
      );
    }

    const product = await Product.create({
      name: name.trim(),
      category,
      imageUrl: imageUrl || "",
      mrp: Number(mrp),
      discountPercent: Number(discountPercent) || 0,
      sellingPrice: Number(sellingPrice),
      description: description || "",
      stock: Number(stock) || 0,
      currency: currency || "INR",
      badge: badge || "",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Product added successfully",
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add product error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to add product" },
      { status: 500 }
    );
  }
}

// PUT: Update a product
export async function PUT(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { id, ...data } = body;

    if (!id || !/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json(
        { success: false, message: "Valid product ID is required" },
        { status: 400 }
      );
    }

    const allowedFields = [
      "name",
      "category",
      "imageUrl",
      "mrp",
      "discountPercent",
      "sellingPrice",
      "description",
      "stock",
      "currency",
      "badge",
    ];

    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    if (updateData.name !== undefined) {
      if (
        typeof updateData.name !== "string" ||
        !updateData.name.trim()
      ) {
        return NextResponse.json(
          { success: false, message: "Product name is required" },
          { status: 400 }
        );
      }

      updateData.name = updateData.name.trim();
    }

    if (updateData.stock !== undefined) {
      const stock = Number(updateData.stock);

      if (!Number.isInteger(stock) || stock < 0) {
        return NextResponse.json(
          { success: false, message: "Stock must be 0 or more" },
          { status: 400 }
        );
      }

      updateData.stock = stock;
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update product" },
      { status: 500 }
    );
  }
}

// PATCH: Reset all product stocks to 40
export async function PATCH() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, message: "Stock reset is disabled in production" },
      { status: 403 }
    );
  }

  try {
    await connectDB();

    const result = await Product.updateMany(
      {},
      { $set: { stock: 40 } }
    );

    return NextResponse.json({
      success: true,
      message: "All product stocks reset to 40",
      productsMatched: result.matchedCount,
      productsUpdated: result.modifiedCount,
    });
  } catch (error) {
    console.error("Stock reset error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to reset product stocks" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a product
export async function DELETE(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || !/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json(
        { success: false, message: "Valid product ID is required" },
        { status: 400 }
      );
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete product" },
      { status: 500 }
    );
  }
}
