
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
  return (
    <DefaultLayout >
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
            <div className="space-x-4">
              <Button asChild className="bg-quicktap-creamy hover:bg-quicktap-creamy/60 text-quicktap-green h-[50px] w-[180px]">
                <Link to="/food" className="text-xl">Order Now</Link>
              </Button>
              <Button asChild className="bg-transparent hover:bg-quicktap-creamy  backdrop-blur text-quicktap-creamy hover:text-quicktap-teal  border h-[50px] w-[180px]">
                <Link to="/food" className="text-xl">Brows Menu</Link>
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
