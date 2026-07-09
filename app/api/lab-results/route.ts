// app/api/lab-results/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  const { data: results } = await supabase
    .from("LabResult")
    .select(`
      *,
      labOrder:lab_orders(orderDate, labName)
    `)
    .eq("userId", session.user.id)
    .order("reportedAt", { ascending: false });

  // Group by lab order or test date
  const grouped = results?.reduce((acc: any[], result) => {
    const key = result.labOrderId || result.id;
    let group = acc.find(g => g.id === key);

    if (!group) {
      group = {
        id: key,
        name: result.testName || "Lab Test",
        date: result.reportedAt ? new Date(result.reportedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Unknown",
        lab: result.labOrder?.labName || "LabCorp",
        orderedBy: "Your Doctor",
        status: "COMPLETED",
        hasAbnormal: result.isAbnormal,
        tests: [],
      };
      acc.push(group);
    }

    group.tests.push(result);
    return acc;
  }, []) || [];

  return NextResponse.json({ labGroups: grouped });
}