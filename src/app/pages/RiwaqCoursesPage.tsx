import { useState, useEffect } from 'react';
import { RiwaqHeader } from '../components/RiwaqHeader';
import { RiwaqFooter } from '../components/RiwaqFooter';
import { Search } from 'lucide-react';
import { CourseCard } from '../components/CourseCard';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

interface Course {
  id: string;
  title: string;
  description: string;
  price: string;
  thumbnail_url: string | null;
  educational_level: string;
  category_name: string;
}

export function RiwaqCoursesPage() {
  const { isAuthenticated } = useAuth();

  const [searchTerm, setSearchTerm]             = useState('');
  const [selectedLevel, setSelectedLevel]       = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [courses, setCourses]                   = useState<Course[]>([]);
  const [favoritedIds, setFavoritedIds]         = useState<Set<string>>(new Set());
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState<string | null>(null);

  const levels = [
    { id: 'all',         label: 'جميع المستويات' },
    { id: 'preparatory', label: 'إعدادي' },
    { id: 'secondary',   label: 'ثانوي' },
    { id: 'university',  label: 'جامعي' },
  ];

  const categories = [
    { id: 'all', label: 'جميع الفئات' },
    ...Array.from(
      new Map(
        courses
          .filter((c) => c.category_name)
          .map((c) => [c.category_name, { id: c.category_name, label: c.category_name }])
      ).values()
    ),
  ];

  useEffect(() => { fetchCourses(); }, []);

  useEffect(() => {
    if (!isAuthenticated) { setFavoritedIds(new Set()); return; }
    fetchFavoriteIds();
  }, [isAuthenticated]);

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/courses');
      setCourses(data.courses || []);
    } catch {
      setError('فشل تحميل الدورات');
    } finally {
      setLoading(false);
    }
  };

  const fetchFavoriteIds = async () => {
    try {
      const { data } = await api.get('/favorites');
      const ids = (data.favorites as { id: string }[]).map((f) => f.id);
      setFavoritedIds(new Set(ids));
    } catch { /* hearts simply start un-filled */ }
  };

  const hasActiveFilters = searchTerm !== '' || selectedLevel !== 'all' || selectedCategory !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedLevel('all');
    setSelectedCategory('all');
  };

  const filteredCourses = courses.filter((course) => {
    const matchesLevel    = selectedLevel === 'all' || course.educational_level === selectedLevel;
    const matchesCategory = selectedCategory === 'all' || course.category_name === selectedCategory;
    const q = searchTerm.toLowerCase();
    const matchesSearch   = !q ||
      course.title.toLowerCase().includes(q) ||
      course.description.toLowerCase().includes(q) ||
      (course.category_name ?? '').toLowerCase().includes(q);
    return matchesLevel && matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 theme-transition">
      <RiwaqHeader currentPage="courses" />

      <main className="flex-1">

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden py-12
          bg-gradient-to-br from-[#2d2468] via-[#3B2F82] to-[#6467AD]
          dark:from-slate-950 dark:via-[#1a1640] dark:to-[#2d2468]
          text-white">
          <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/5" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <h1 className="text-3xl md:text-4xl mb-4 text-center text-white font-bold">
              مكتبة الدورات التعليمية
            </h1>
            <p className="text-lg text-white/80 text-center max-w-2xl mx-auto">
              اختر من بين مجموعة واسعة من الدورات التعليمية المتخصصة في مختلف المجالات
            </p>
          </div>
        </section>

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <section className="
          bg-white dark:bg-slate-950
          border-b border-gray-200 dark:border-slate-800
          py-5 sticky top-0 z-10
          shadow-sm dark:shadow-slate-900/80
          theme-transition">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">

            {/* Search */}
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <Search
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="ابحث باسم الدورة أو الفئة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5
                    bg-gray-100 dark:bg-slate-800
                    border border-gray-200 dark:border-slate-700
                    rounded-lg text-sm
                    text-gray-900 dark:text-slate-100
                    placeholder-gray-400 dark:placeholder-slate-500
                    focus:outline-none focus:ring-2 focus:ring-[#3B2F82] dark:focus:ring-[#8478C9]
                    theme-transition"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"
                  >
                    ✕
                  </button>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="whitespace-nowrap text-xs
                    text-gray-500 dark:text-slate-400
                    hover:text-gray-800 dark:hover:text-slate-200
                    border border-gray-300 dark:border-slate-700
                    rounded-lg px-3 py-2.5 transition-colors theme-transition"
                >
                  مسح الفلاتر
                </button>
              )}
            </div>

            {/* Level pills */}
            <div className="flex gap-2 overflow-x-auto pb-0.5">
              {levels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setSelectedLevel(level.id)}
                  className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors theme-transition ${
                    selectedLevel === level.id
                      ? 'bg-[#3B2F82] dark:bg-[#8478C9] text-white'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>

            {/* Category pills */}
            {categories.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-0.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors border theme-transition ${
                      selectedCategory === cat.id
                        ? 'bg-[#6467AD] dark:bg-slate-700 text-white dark:text-slate-100 border-[#6467AD] dark:border-slate-600'
                        : 'bg-transparent text-gray-500 dark:text-slate-400 border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Courses Grid ─────────────────────────────────────────────────── */}
        <section className="py-12 bg-white dark:bg-slate-950 theme-transition">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B2F82] dark:border-[#8478C9]" />
                <p className="mt-4 text-gray-500 dark:text-slate-400">جاري تحميل الدورات...</p>
              </div>

            ) : error ? (
              <div className="text-center py-16">
                <p className="text-xl text-red-500 dark:text-red-400">{error}</p>
                <button
                  onClick={fetchCourses}
                  className="mt-4 px-6 py-2 bg-[#3B2F82] dark:bg-[#8478C9] text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  إعادة المحاولة
                </button>
              </div>

            ) : (
              <>
                <p className="mb-6 text-sm text-gray-400 dark:text-slate-500">
                  عرض {filteredCourses.length} من {courses.length} دورة
                </p>

                {filteredCourses.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-xl text-gray-400 dark:text-slate-500">
                      {courses.length === 0 ? 'لا توجد دورات حالياً' : 'لا توجد دورات مطابقة لبحثك'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course) => (
                      <CourseCard
                        key={course.id}
                        id={course.id}
                        title={course.title}
                        description={course.description}
                        price={course.price}
                        thumbnail_url={course.thumbnail_url}
                        educational_level={course.educational_level}
                        category_name={course.category_name}
                        showFavorite={isAuthenticated}
                        isFavorited={favoritedIds.has(course.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

      </main>

      <RiwaqFooter />
    </div>
  );
}
