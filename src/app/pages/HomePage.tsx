import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Link } from "../components/Link";
import { BookOpen, Users, Award, TrendingUp } from "lucide-react";

const featuredCourses = [
  {
    id: 1,
    title: "أساسيات البرمجة بلغة Python",
    description: "تعلم البرمجة من الصفر باستخدام لغة Python مع تطبيقات عملية",
    price: "قريبًا",
    image: ""
  },
  {
    id: 2,
    title: "تصميم تجربة المستخدم UX/UI",
    description: "دورة شاملة في تصميم واجهات المستخدم وتجربة المستخدم",
    price: "قريبًا",
    image: ""
  },
  {
    id: 3,
    title: "التسويق الرقمي الاحترافي",
    description: "احترف التسويق الإلكتروني ووسائل التواصل الاجتماعي",
    price: "قريبًا",
    image: ""
  }
];

const features = [
  {
    icon: BookOpen,
    title: "محتوى تعليمي متميز",
    description: "دورات مصممة بعناية من خبراء في المجال"
  },
  {
    icon: Users,
    title: "مدربون محترفون",
    description: "تعلم من أفضل المدربين والخبراء"
  },
  {
    icon: Award,
    title: "شهادات معتمدة",
    description: "احصل على شهادة إتمام بعد إنهاء الدورة"
  },
  {
    icon: TrendingUp,
    title: "تطوير مستمر",
    description: "محتوى محدث باستمرار لمواكبة التطورات"
  }
];

export function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-transparent py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl mb-6">
            ابدأ رحلتك التعليمية مع <span className="text-primary">رواق</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            منصة تعليمية متكاملة تقدم دورات احترافية في مختلف المجالات لتطوير مهاراتك وتحقيق أهدافك
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/courses">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                استكشف الدورات
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                انضم الآن
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center mb-12">لماذا رواق؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="mb-4">الدورات المميزة</h2>
            <p className="text-muted-foreground">اختر من مجموعة واسعة من الدورات التعليمية</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* BLACK SOON PLACEHOLDER */}
                <div className="w-full h-48 bg-black flex items-center justify-center">
                  <span className="text-white text-4xl font-bold tracking-widest opacity-80">SOON</span>
                </div>
                <div className="p-6">
                  <h3 className="mb-2">{course.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{course.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg text-primary">{course.price}</span>
                    <Link href={`/course/${course.id}`}>
                      <Button size="sm">عرض التفاصيل</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/courses">
              <Button variant="outline" size="lg">
                عرض جميع الدورات
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="mb-6">رؤيتنا</h2>
          <p className="text-lg opacity-90 leading-relaxed">
            نسعى في رواق لتوفير تعليم عالي الجودة ومتاح للجميع، نؤمن بأن التعليم هو مفتاح النجاح والتطور،
            ونعمل على تمكين المتعلمين من اكتساب المهارات اللازمة لتحقيق أهدافهم المهنية والشخصية في عالم متغير.
          </p>
        </div>
      </section>
    </div>
  );
}
