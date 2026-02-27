import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { RiwaqHeader } from '../app/components/RiwaqHeader';
import { RiwaqFooter } from '../app/components/RiwaqFooter';
import { CourseCard } from '../app/components/CourseCard';
import { api } from '../lib/api';

interface FavoriteCourse {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  price: string;
  educational_level: string;
  category_name: string | null;
  favorited_at: string;
}

export function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteCourse[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const { data } = await api.get('/favorites');
      setFavorites(data.favorites || []);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <RiwaqHeader />

      <main className="flex-1 bg-muted/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page heading */}
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-red-100 rounded-full p-3">
              <Heart className="w-6 h-6 text-red-500" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-3xl">المفضلة</h1>
              <p className="text-muted-foreground text-sm mt-0.5">الدورات التي أضفتها إلى مفضلتك</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
              <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-xl text-muted-foreground mb-2">لا توجد دورات في المفضلة بعد</p>
              <p className="text-muted-foreground text-sm mb-6">
                تصفح الدورات واضغط على قلب أي دورة لإضافتها هنا
              </p>
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                استكشاف الدورات
              </Link>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground mb-6">{favorites.length} دورة محفوظة</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((course) => (
                  <CourseCard
                    key={course.id}
                    id={course.id}
                    title={course.title}
                    description={course.description}
                    price={course.price}
                    thumbnail_url={course.thumbnail_url}
                    educational_level={course.educational_level}
                    category_name={course.category_name ?? undefined}
                    showFavorite={true}
                    isFavorited={true}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <RiwaqFooter />
    </div>
  );
}
