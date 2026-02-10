import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto redirect to dashboard after 3 seconds
    const timer = setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-primary">404</h1>
        <p className="text-lg text-muted-foreground">Halaman tidak ditemukan</p>
        <p className="text-sm text-muted-foreground">Mengalihkan ke dashboard...</p>
        <Button onClick={() => navigate('/dashboard', { replace: true })} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
