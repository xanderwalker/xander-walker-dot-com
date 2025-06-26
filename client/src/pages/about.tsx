import { Link } from 'wouter';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';

export default function About() {
  const timelineEvents = [
    {
      year: "2023",
      title: "EV Service Pros Launch",
      description: "Connecting electric vehicle owners with quality service providers specializing in EV's and helping legacy independent shops transition to the EV economy.",
      color: "electric-orange"
    },
    {
      year: "2022",
      title: "Marriage",
      description: "Married Sarah in New York.",
      color: "neon-green"
    },
    {
      year: "2021-2022",
      title: "Rivian R1T, R1S, Amazon EDV",
      description: "First ever revenue generating transactions for Rivian, activating dealer licenses.",
      color: "cyan-blue"
    },
    {
      year: "2020-2021",
      title: "Rivian Digital Ecosystem",
      description: "Building a direct to consumer digital ecosystem from scratch.",
      color: "electric-red"
    },
    {
      year: "2020",
      title: "Kitty Hawk",
      description: "Electric Vertical Takeoff and Landing.",
      color: "electric-orange"
    },
    {
      year: "2019",
      title: "Tesla & California Move",
      description: "Tesla used vehicle delivery & logistics in Fremont: insourcing, vertically integrating, reducing time to deliver. Moved to California. European Model 3 Launch: 'delivery logistics hell' with massive ships & Swiss import customs.",
      color: "neon-green"
    },
    {
      year: "2018",
      title: "Model 3 Launch & Ramp",
      description: "'Delivery logistics hell' and back.",
      color: "cyan-blue"
    },
    {
      year: "2016",
      title: "Tesla Remarketing & NYC",
      description: "Wholesale auctions, retail sales, residual values, repair & refurbishment, dynamic pricing. Moved to New York.",
      color: "electric-red"
    },
    {
      year: "2015",
      title: "Model X Launch",
      description: "One step forward, two steps back.",
      color: "electric-orange"
    },
    {
      year: "2014",
      title: "Dual Motor & Autopilot",
      description: "Launch in Hawthorne: Witnessing the future.",
      color: "neon-green"
    },
    {
      year: "2013-2014",
      title: "Tesla Model S Deliveries",
      description: "DC metro & Atlanta: Tip of the spear of Tesla's direct to consumer model.",
      color: "cyan-blue"
    },
    {
      year: "2011-2012",
      title: "Early Digital Work",
      description: "Ecommerce, art, & blogging about motorsports & car culture.",
      color: "electric-red"
    },
    {
      year: "2010",
      title: "Winemaking",
      description: "Winemaking in Bordeaux.",
      color: "electric-orange"
    },
    {
      year: "2008-2010",
      title: "The Aspen Institute",
      description: "Climate change, clean energy, corporate sponsors, COP 15.",
      color: "neon-green"
    },
    {
      year: "2005-2009",
      title: "Tulane University",
      description: "Hurricanes, humidity, Human Development Index, Henry Kissinger, high interest debt.",
      color: "cyan-blue"
    }
  ];

  return (
    <Layout title="XANDER WALKER">
      <div className="max-w-7xl mx-auto relative z-30">
        {/* Timeline */}
        <div className="mb-12">
          <h2 className="font-xanman-wide mb-8 text-center text-black uppercase" style={{fontSize: '55px', lineHeight: '1.2'}}>
            BIO
          </h2>
          <div className="space-y-8">
            {timelineEvents.map((event, index) => {
              // Define which images belong to each section
              const getEventImages = (title: string) => {
                switch(title) {
                  case "Kitty Hawk":
                    return ["/assets/flyerweb_1750891603226.png"];
                  case "Rivian R1T, R1S, Amazon EDV":
                  case "Rivian Digital Ecosystem":
                    return ["/assets/r1tweb_1750891603226.png", "/assets/edvweb_1750891603225.png"];
                  case "The Aspen Institute":
                    return ["/assets/aspenweb_1750891603226.png"];
                  case "Tulane University":
                    return ["/assets/tulaneforweb2_1750891603227.png"];
                  case "Tesla & California Move":
                  case "Model 3 Launch & Ramp":
                  case "Tesla Remarketing & NYC":
                  case "Model X Launch":
                  case "Dual Motor & Autopilot":
                  case "Tesla Model S Deliveries":
                    return [
                      "/assets/model3web_1750891603218.png", 
                      "/assets/modelxweb_1750891603226.png",
                      "/assets/vikingadventureweb_1750891603225.png"
                    ];
                  default:
                    return [];
                }
              };

              const eventImages = getEventImages(event.title);

              return (
                <div key={index} className="glassmorphism rounded-2xl p-6 relative z-30 pointer-events-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Text Column */}
                    <div className="space-y-4">
                      <div className={`text-${event.color} font-xanman-wide uppercase`} style={{fontSize: '55px', lineHeight: '1.2'}}>
                        {event.year}
                      </div>
                      <h3 className="font-xanman-wide text-black uppercase" style={{fontSize: '55px', lineHeight: '1.2'}}>
                        {event.title}
                      </h3>
                      <p className="text-gray-700 leading-relaxed uppercase font-xanman-wide" style={{fontSize: '55px', lineHeight: '1.2'}}>
                        {event.description}
                      </p>
                    </div>
                    
                    {/* Images Column */}
                    <div className="flex flex-col gap-4">
                      {eventImages.map((imageSrc, imgIndex) => (
                        <img 
                          key={imgIndex}
                          src={imageSrc} 
                          alt={`${event.title} image ${imgIndex + 1}`} 
                          className="w-full h-auto glassmorphism rounded-lg p-4" 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <div className="glassmorphism rounded-2xl p-8 text-center mb-8 relative z-30 pointer-events-auto">
          <p className="text-gray-700 mb-6 font-xanman-wide uppercase" style={{fontSize: '55px', lineHeight: '1.2'}}>
            IF YOU'D LIKE ME TO ADD SOME MORE COLOR TO THIS STORY, SHOOT ME AN EMAIL OR A DM ON TWITTER.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button className="bg-electric-orange hover:bg-electric-orange hover:opacity-90 text-black font-xanman-wide uppercase" style={{fontSize: '55px', lineHeight: '1.2', padding: '20px 40px'}}>
                GET IN TOUCH
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="bg-black bg-opacity-10 border-black border-opacity-20 hover:bg-opacity-20 font-xanman-wide uppercase" style={{fontSize: '55px', lineHeight: '1.2', padding: '20px 40px'}}>
                ← BACK TO HOME
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
