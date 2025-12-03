
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DefaultLayout } from "@/components/layout/DefaultLayout";
import { Link } from "react-router-dom";

const featureCards = [
  {
    title: "Food Ordering",
    description: "Order your favorite food from us with just a few clicks.",
    link: "/food",
    linkText: "Order Food",
    imgsrc: "/home/splashburger.jpg"
  },
  {
    title: "Chatbot Assistant",
    description: "Instant answers to your questions about restaurant orders and delivery.",
    link: "/chatbot",
    linkText: "Ask Questions",
    imgsrc: "/home/ai.png"
  }
];

const heroImg1 = "/home/cake.png";
const heroImg2 = "/home/pan.png";

export default function Home() {
  const handleFeedbackClick = () => {
    const reviewUrl = import.meta.env.VITE_GOOGLE_MAPS_REVIEW_URL || 'https://share.google/cbBjzGYI789EORiyA';
    window.open(reviewUrl, '_blank');
  };

  return (
    <DefaultLayout >
      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {/* Get Offers Button */}
        <Link to="/loyalty">
          <button
            className="bg-quicktap-creamy hover:bg-quicktap-creamy/90 text-quicktap-navy 
                       rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 
                       flex items-center gap-2 group-loyalty"
            title="Get Offers"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
            <span className="hidden group-loyalty-hover:inline-block font-medium">Get Offers</span>
          </button>
        </Link>

        {/* Rate Us Button */}
        <button
          onClick={handleFeedbackClick}
          className="bg-quicktap-teal hover:bg-quicktap-teal/90 text-white 
                     rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 
                     flex items-center gap-2 group-feedback"
          title="Leave a Review"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <span className="hidden group-feedback-hover:inline-block text-white font-medium">Rate Us</span>
        </button>
      </div>

      <div className=" hidden md:block w-full h-full absolute overflow-x-hidden top-0 left-0 -z-1">
        <div className=" heroImage absolute -left-44"><img src={heroImg1} alt="" /></div>
        <div className=" heroImage absolute rotate-45  -right-36  overflow-hidden"><img src={heroImg2} alt="" /></div>
      </div>

      {/* Hero Section */}
      <section className=" text-white py-16 md:py-12 w-full relative"  >
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2 mt-0">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl text-quicktap-creamy tracking-[5px]" style={{ fontFamily: 'Heyam, sans-serif' }}>
                hola, Quick - Tap
              </h1>
              <p className="mx-auto max-w-[300px] text-quicktap-creamy/50 md:text-3xl font-bold">
                {/* Crave??? We got you covered, Tap. Eat. Repeat.! */}
                feeling bad?, a plate of food can fix it all!
              </p>
            </div>
            <div>
              {/* <img src="../../public/undraw_breakfast_rgx5.svg" alt="" className="size-64" /> */}

            </div>
            <div className="flex flex-col gap-3 md:gap-4 md:flex-row justify-center items-center mt-6 w-full px-4 md:px-0">
              <Button asChild className="bg-quicktap-creamy hover:bg-quicktap-creamy/60 text-quicktap-green h-[50px] w-full md:w-[180px] text-lg md:text-xl font-semibold">
                <Link to="/food">Order Now</Link>
              </Button> 
              <Button asChild className="bg-transparent hover:bg-quicktap-creamy backdrop-blur text-quicktap-creamy hover:text-quicktap-teal border h-[50px] w-full md:w-[180px] text-lg md:text-xl font-semibold">
                <Link to="/food">Browse Menu</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>  

      {/* Features Section */}
      <section className="py-5 md:py-5 w-full ">
        <div className="container px-4 md:px-6 flex flex-col justify-center items-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 ">
            {featureCards.map((feature, index) => (
              <Link to={feature.link} key={index}>
                <Card className="group relative border border-border hover:shadow-md transition-all h-[300px] hover:rounded-xl hover:duration-200 duration-200 rounded-3xl">
                  <CardHeader className="z-100">
                    <CardTitle className="text-3xl font-bold">{feature.title}</CardTitle>
                    <CardDescription className="text-xl text-quicktap-darkGray">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 -z-20">
                    <img
                      src={feature.imgsrc}
                      alt={feature.title}
                      className="w-[200px] h-[200px] mix-blend-darken -z-12 absolute right-0 top-20 object-cover rounded-xl pointer-events-none select-none 
                       transition-transform duration-300 group-hover:-translate-y-2"
                    />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

        </div>
      </section>
    </DefaultLayout>
  );
}
