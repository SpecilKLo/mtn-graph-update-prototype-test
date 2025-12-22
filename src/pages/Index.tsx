import { UsageChart } from "@/components/UsageChart";

const Index = () => {
  return (
    <div className="min-h-screen bg-muted p-4 md:p-8">
      <div className="max-w-7xl mx-auto h-[calc(100vh-4rem)]">
        <UsageChart />
      </div>
    </div>
  );
};

export default Index;