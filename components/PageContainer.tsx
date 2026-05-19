import { ReactNode } from "react";
import Link from "next/link";


interface Breadcrumb {
  label: string;
  href?: string;
}

export interface PageContainerProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  children: ReactNode;
  // Allow hiding standard negative margin overlap behavior
  overlap?: boolean;
}

export default function PageContainer({
  title,
  description,
  breadcrumbs = [],
  actions,
  children,
  overlap = true,
}: PageContainerProps) {
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-[#F6F7F9] pb-12">
      {/* Top Contrast Canopy */}
      <div className={`bg-[#111317] text-white pt-10 ${overlap ? 'pb-32' : 'pb-12'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb & Date Row */}
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-6 tracking-wider">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/dashboard" className="hover:text-gray-300 transition-colors">
                Overview
              </Link>
              {breadcrumbs.map((crumb, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="opacity-50">/</span>
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-gray-300 transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-gray-300">{crumb.label}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="hidden sm:block text-gray-400">{currentDate}</div>
          </div>

          {/* Header Heading */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                {title}
              </h1>
              {description && (
                <p className="text-gray-400 text-sm sm:text-base max-w-2xl leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {actions && (
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${overlap ? '-mt-20 relative z-10' : 'mt-8'}`}>
        {children}
      </div>
    </div>
  );
}
