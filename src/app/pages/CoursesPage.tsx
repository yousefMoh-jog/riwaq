import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Link } from "../components/Link";
import { Input } from "../components/ui/input";
import { Search, Filter } from "lucide-react";
import { useState } from "react";

const courses = [
  {
    id: 1,
    title: "أساسيات البرمجة بلغة Python",
    description: "تعلم البرمجة من الصفر باستخدام لغة Python مع تطبيقات عملية",
    // price removed (placeholder only)
    category: "برمجة",
  },
  {
    id: 2,
    title: "تصميم تجربة المستخدم UX/UI",
    description: "دورة شاملة في تصميم واجهات المستخدم وتجربة المستخدم",
    category: "تصميم",
  },
  {
    id: 3,
    title: "التسويق الرقمي الاحترافي",
    description: "احترف التسويق الإلكتروني ووسائل التواصل الاجتماعي",
    category: "تسويق",
  },
  {
    id: 4,
    title: "تطوير تطبيقات الويب بـ React",
    description: "تعلم بناء تطبيقات ويب تفاعلية حديثة باستخدام React",
    category: "برمجة",
  },
  {
    id: 5,
    title: "إدارة المشاريع الاحترافية",
    description: "أساسيات ومبادئ إدارة المشاريع الناجحة",
    category: "إدارة",
  },
  {
    id: 6,
    title: "التصوير الفوتوغرافي للمبتدئين",
    description: "تعلم أساسيات التصوير الفوتوغرافي الاحترافي",
    category: "فنون",
  },
  {
    id: 7,
    title: "تحليل البيانات بـ Excel",
    description: "احترف تحليل البيانات والتقارير باستخدام Excel",
    category: "تحليل",
  },
  {
    id: 8,
    title: "الذكاء الاصطناعي للمبتدئين",
    description: "مقدمة شاملة في مجال الذكاء الاصطناعي وتطبيقاته",
    category: "تقنية",
  },
  {
    id: 9,
    title: "مهارات التواصل الفعال",
    description: "طور مهارات التواصل والعرض والتقديم",
    category: "تطوير ذاتي",
  },
];

function SoonThumbnail() {
  return (
    <div className="w-full h-48 bg-black flex items-center justify-center">
      <span className="text-white text-2xl font-bold tracking-widest opacity-80">
        SOON
      </span>
    </div>
  );
}

export function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCourses = courses.filter(
    (course) =>
      course.title.includes(searchQuery) ||
      course.description.includes(searchQuery)
  );

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="mb-4">جميع الدورات</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            اكتشف مجموعة واسعة من الدورات التعليمية المتخصصة في مختلف المجالات
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="ابحث عن دورة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            تصفية
          </Button>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card
              key={course.id}
              className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
            >
              {/* BLACK SOON THUMBNAIL */}
              <SoonThumbnail />

              <div className="p-6 flex-1 flex flex-col">
                <div className="mb-2">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {course.category}
                  </span>
                </div>

                <h3 className="mb-2">{course.title}</h3>

                <p className="text-sm text-muted-foreground mb-4 flex-1">
                  {course.description}
                </p>

                <div className="flex items-center justify-between mt-auto">
                  {/* PLACEHOLDER PRICE */}
                  <span className="text-lg text-primary">قريبًا</span>

                  <Link href={`/course/${course.id}`}>
                    <Button size="sm">عرض التفاصيل</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">لا توجد دورات مطابقة لبحثك</p>
          </div>
        )}
      </div>
    </div>
  );
}
