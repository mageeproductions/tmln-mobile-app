export default function PhoneScroll() {
  const features = [
    {
      title: "Live, Dynamic Event Timeline",
      description: "Tired of yourself or other vendors not having an up to date timeline? The TMLN App completely eliminates that possibility. The live, dynamic timeline ensures that everyone is on the same page. Speeches get pushed back 15 minutes? Just a couple taps and every vendor is immediately notified.",
      phonePosition: "left",
      screenshot: "/image.png"
    },
    {
      title: "Manage All Your Events in One Place",
      description: "Viewing and managing your events has never been easier. The simple UI ensures everything you need is right at your fingertips.",
      phonePosition: "right",
      screenshot: "/image copy copy copy.png"
    },
    {
      title: "All Event Details in One Place",
      description: "Navigating to locations, knowing your main point of contact, list of vendors, social media handles, and any additional event notes have never been easier to access.",
      phonePosition: "left",
      screenshot: "/image copy.png"
    },
    {
      title: "Share Deliverables with Fellow Vendors",
      description: "Never need to bug the photographer or videographer again. The links to the photo galleries and videos are immediately and consistently available in the event details.",
      phonePosition: "right",
      screenshot: "/image copy copy.png"
    }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#1D1F2E] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl sm:text-5xl font-bold">
            The Wedding & Event Timeline App Built for{' '}
            <span className="gradient-text">Seamless Planning</span>
          </h2>
        </div>

        <div className="space-y-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-12 ${
                feature.phonePosition === "right" ? "lg:flex-row-reverse" : ""
              }`}
            >
              <div className="flex-1 relative">
                <div className="relative max-w-xs mx-auto" style={{ maxWidth: '280px' }}>
                  {feature.screenshot ? (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ padding: '4.5% 3.5% 4.5% 3.5%' }}>
                      <img
                        src={feature.screenshot}
                        alt={feature.title}
                        className="w-full h-full object-cover rounded-[10%]"
                        style={{ objectPosition: 'center' }}
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ padding: '14% 8%' }}>
                      <div className="bg-white rounded-3xl p-4 shadow-2xl w-full h-full overflow-hidden">
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                          <div className="pt-3 space-y-1.5">
                            <div className="h-2 bg-gray-100 rounded w-full"></div>
                            <div className="h-2 bg-gray-100 rounded w-4/5"></div>
                            <div className="h-2 bg-gray-100 rounded w-3/5"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <img
                    src="/apple-iphone-17-2025-medium.png"
                    alt="iPhone mockup"
                    className="relative w-full h-auto z-10"
                  />
                </div>
              </div>

              <div className="flex-1 text-center lg:text-left space-y-3">
                <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                  {feature.title}
                </h2>
                <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-lg">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500 mt-12 mb-0">
          App is currently in development, design shown is not final
        </p>
      </div>
    </section>
  );
}
