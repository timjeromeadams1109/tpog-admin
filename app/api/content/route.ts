import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { scope, key, value } = await request.json();

    if (!scope || !key || !value) {
      return NextResponse.json(
        { error: "Missing scope, key, or value" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("app_content")
      .upsert(
        [
          {
            scope,
            key,
            value,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "scope,key" }
      )
      .select();

    if (error) {
      console.error("[POST /api/content]", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[POST /api/content]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { scope, key } = await request.json();

    if (!scope || !key) {
      return NextResponse.json(
        { error: "Missing scope or key" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from("app_content")
      .delete()
      .eq("scope", scope)
      .eq("key", key);

    if (error) {
      console.error("[DELETE /api/content]", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/content]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    }
}
