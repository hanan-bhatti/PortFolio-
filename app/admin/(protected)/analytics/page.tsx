/**
 * @file app/admin/(protected)/analytics/page.tsx
 * @description Next.js route view page or layout component for page.tsx.
 * 
 * @exports
 * - AnalyticsDashboardPage (default): Main React component or function
 * - dynamic: Constant / Helper
 */

import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/admin/PageHeader";
import ClearAnalyticsButton from "@/components/admin/ClearAnalyticsButton";
import AnalyticsDashboardClient from "./AnalyticsDashboardClient";
import { getAnalyticsData, type AnalyticsFiltersState } from "./actions";

export const dynamic = "force-dynamic";

export default async function AnalyticsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const range = (resolvedSearchParams.range as string) || "30d";
  const filterPath = (resolvedSearchParams.path as string) || "";
  const filterDevice = (resolvedSearchParams.device as string) || "";
  const filterCountry = (resolvedSearchParams.country as string) || "";
  const chartRange = (resolvedSearchParams.chartRange as string) || "30d";

  async function clearAnalytics() {
    "use server";
    await prisma.pageView.deleteMany();
    await prisma.visitor.deleteMany();
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/admin/analytics");
  }

  // Build the initial filters object
  const initialFilters: AnalyticsFiltersState = {
    range,
    path: filterPath,
    device: filterDevice,
    country: filterCountry,
    chartRange,
  };

  // Fetch initial data and available countries concurrently
  const [initialData, allCountriesRaw] = await Promise.all([
    getAnalyticsData(initialFilters),
    prisma.visitor.groupBy({
      by: ["country"],
      where: { country: { not: null } },
      _count: { id: true },
      orderBy: { country: "asc" },
    }),
  ]);

  const countriesList = allCountriesRaw
    .map((c) => c.country as string)
    .filter(Boolean);

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Analytics"
        crumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Analytics" }]}
        inlineAction={true}
        action={<ClearAnalyticsButton clearAction={clearAnalytics} />}
      />

      <AnalyticsDashboardClient
        initialData={initialData}
        countries={countriesList}
        initialFilters={initialFilters}
      />
    </div>
  );
}
