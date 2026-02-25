import { Play, BookOpen } from 'lucide-react';

interface CourseCardProps {
  id: number;
  title: string;
  description: string;
  price?: string;
  duration?: string;
  lessons?: number;
  thumbnail?: string;
  onClick?: () => void;
}

export function CourseCard({
  id,
  title,
  description,
  // price,
  // duration,
  // lessons,
  // thumbnail,
  onClick,
}: CourseCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group">
      {/* BLACK SOON THUMBNAIL (replaces image) */}
      <div className="relative overflow-hidden aspect-video bg-black flex items-center justify-center">
        <span className="text-white text-2xl font-bold tracking-widest opacity-80">
          SOON
        </span>

        {/* Keep hover play overlay if you want (optional) */}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
            <Play size={28} className="text-accent-foreground mr-1" />
          </div>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4 line-clamp-2">{description}</p>

        {/* PLACEHOLDER META */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <BookOpen size={16} />
            — درس
          </span>
          <span>—</span>
        </div>

        <div className="flex items-center justify-between">
          {/* PLACEHOLDER PRICE */}
          <span className="text-2xl text-primary">قريبًا</span>

          <a
            href={`#course-${id}`}
            onClick={onClick}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            عرض التفاصيل
          </a>
        </div>
      </div>
    </div>
  );
}
