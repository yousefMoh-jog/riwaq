import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { educationalLevelLabel } from '../../lib/utils';
import { api } from '../../lib/api';

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  price: string | number;
  thumbnail_url?: string | null;
  educational_level?: string;
  category_name?: string;
  /** Only render the heart button for authenticated users */
  showFavorite?: boolean;
  /** Initial favorited state — kept in sync with prop changes */
  isFavorited?: boolean;
}

export function CourseCard({
  id,
  title,
  description,
  price,
  thumbnail_url,
  educational_level,
  category_name,
  showFavorite = false,
  isFavorited: initialFavorited = false,
}: CourseCardProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [toggling, setToggling]   = useState(false);

  // Sync whenever the parent updates isFavorited (e.g. favorites fetch completes
  // after the card has already mounted, which is the common race-condition case).
  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (toggling) return;

    // Guard: no token means the user is not authenticated
    if (!localStorage.getItem('accessToken')) {
      toast.error('يجب تسجيل الدخول أولاً لإضافة الدورة إلى المفضلة', { duration: 3000 });
      return;
    }

    const newFavorited = !favorited;
    setToggling(true);
    setFavorited(newFavorited); // optimistic update

    try {
      await api.post(`/courses/${id}/favorite`);
      // Only reaches here on HTTP 2xx — show success toast
      toast.success(
        newFavorited ? 'تمت الإضافة إلى المفضلة ❤️' : 'تمت الإزالة من المفضلة',
        { duration: 2000 }
      );
    } catch (err: any) {
      setFavorited(!newFavorited); // rollback on failure
      // The api interceptor wraps errors into plain Error objects,
      // so err.message already contains the localised server message.
      const msg = err?.message || 'فشلت العملية، حاول مجدداً';
      toast.error(msg, { duration: 3000 });
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Thumbnail */}
      <div className="relative overflow-hidden aspect-video">
        <ImageWithFallback
          src={thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&h=300&fit=crop'}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
            <Play size={28} className="text-accent-foreground mr-1" />
          </div>
        </div>

        {/* Heart / Favorite toggle */}
        {showFavorite && (
          <button
            onClick={handleFavoriteToggle}
            disabled={toggling}
            title={favorited ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
            className={`absolute top-2 left-2 p-2 rounded-full shadow-md transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              ${favorited
                ? 'bg-red-500 text-white hover:bg-red-600 scale-110'
                : 'bg-black/50 text-white hover:bg-black/70'
              }`}
          >
            <Heart
              size={16}
              fill={favorited ? 'currentColor' : 'none'}
              className={`transition-transform duration-150 ${toggling ? 'scale-75' : 'scale-100'}`}
            />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-6">
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1">
            <h3 className="text-xl mb-1">{title}</h3>
            {category_name && (
              <p className="text-xs text-primary mb-2">{category_name}</p>
            )}
          </div>
          {educational_level && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full whitespace-nowrap">
              {educationalLevelLabel(educational_level)}
            </span>
          )}
        </div>

        <p className="text-muted-foreground mb-4 line-clamp-2">{description}</p>

        <div className="flex items-center justify-between">
          {price !== '' && price !== undefined && (
            <span className="text-2xl text-primary">{price} د.ل</span>
          )}
          <Link
            to={`/course/${id}`}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors ml-auto"
          >
            عرض التفاصيل
          </Link>
        </div>
      </div>
    </div>
  );
}
