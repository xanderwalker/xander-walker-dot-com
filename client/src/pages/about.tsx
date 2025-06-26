import { Link } from 'wouter';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';

export default function About() {
  const timelineEvents = [
    {
      year: "2024",
      title: "Scout Motors: Launching VW Group's first direct to consumer brand",
      image: null
    },
    {
      year: "2023",
      title: "Launching EV Service Pros: Connecting electric vehicle owners with quality service providers specializing in EVs and helping legacy independent shops transition to the EV economy.",
      image: null
    },
    {
      year: "2021–2022",
      title: "Rivian R1T, R1S, Amazon EDV launches: first-ever revenue-generating transactions for Rivian, activating dealer licenses.",
      image: "/assets/r1tweb_1750891603226.png"
    },
    {
      year: "2020–2021",
      title: "Rivian: Building a direct-to-consumer digital ecosystem from scratch.",
      image: "/assets/edvweb_1750891603225.png"
    },
    {
      year: "2020",
      title: "Kitty Hawk: Electric Vertical Takeoff and Landing.",
      image: "/assets/flyerweb_1750891603226.png"
    },
    {
      year: "2019",
      title: "Tesla used-vehicle delivery & logistics in Fremont: insourcing, vertical integration, reducing time to deliver.",
      image: null
    },
    {
      year: "2019",
      title: "Moved to California.",
      image: null
    },
    {
      year: "2019",
      title: "European Model 3 Launch: \"delivery logistics hell\" with massive ships & Swiss import customs.",
      image: "/assets/model3web_1750891603218.png"
    },
    {
      year: "2018",
      title: "Model 3 launch & ramp: \"delivery logistics hell\" and back.",
      image: null
    },
    {
      year: "2016",
      title: "Tesla Remarketing: wholesale auctions, retail sales, residual values, repair & refurbishment, dynamic pricing.",
      image: "/assets/vikingadventureweb_1750891603225.png"
    },
    {
      year: "2016",
      title: "Moved to New York.",
      image: null
    },
    {
      year: "2015",
      title: "Model X Launch: one step forward, two steps back.",
      image: "/assets/modelxweb_1750891603226.png"
    },
    {
      year: "2014",
      title: "Dual Motor & Autopilot Launch in Hawthorne: witnessing the future.",
      image: null
    },
    {
      year: "2013–2014",
      title: "Tesla Model S deliveries in DC metro & Atlanta: tip of the spear of Tesla's direct-to-consumer model.",
      image: null
    },
    {
      year: "2011–2012",
      title: "e-commerce, art, & blogging about motorsports & car culture.",
      image: null
    },
    {
      year: "2010",
      title: "Winemaking in Bordeaux.",
      image: null
    },
    {
      year: "2008–2010",
      title: "The Aspen Institute: climate change, clean energy, corporate sponsors, COP 15.",
      image: "/assets/aspenweb_1750891603226.png"
    },
    {
      year: "2005–2009",
      title: "Tulane University: hurricanes, humidity, Human Development Index, Henry Kissinger, high-interest debt.",
      image: "/assets/tulaneforweb2_1750891603227.png"
    }
  ];

  return (
    <Layout title="XANDER WALKER">
      <div className="max-w-7xl mx-auto relative z-30">
        {/* Resume Timeline */}
        <div className="mb-12">
          <h2 className="font-bold mb-12 text-center text-black uppercase" style={{fontSize: '55px', lineHeight: '1.2'}}>
            RESUME
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {timelineEvents.map((event, index) => (
              <div key={index} className="glassmorphism rounded-2xl p-6 relative z-30 pointer-events-auto">
                {/* Date at top */}
                <div className="font-bold text-electric-orange uppercase mb-4 text-center" style={{fontSize: '32px', lineHeight: '1.2'}}>
                  {event.year}
                </div>
                
                {/* Image below date if exists */}
                {event.image && (
                  <div className="mb-4 flex justify-center">
                    <img 
                      src={event.image} 
                      alt={`${event.year} artwork`} 
                      className="w-full max-w-[200px] h-auto" 
                    />
                  </div>
                )}
                
                {/* Description below image */}
                <div className="text-black font-sans uppercase text-center" style={{fontSize: '18px', lineHeight: '1.3'}}>
                  {event.title}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="glassmorphism rounded-2xl p-8 text-center mb-8 relative z-30 pointer-events-auto">
          <p className="text-gray-700 mb-6 font-sans uppercase" style={{fontSize: '24px', lineHeight: '1.2'}}>
            IF YOU'D LIKE ME TO ADD SOME MORE COLOR TO THIS STORY, SHOOT ME AN EMAIL OR A DM ON TWITTER.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button className="bg-electric-orange hover:bg-electric-orange hover:opacity-90 text-black font-bold uppercase" style={{fontSize: '20px', lineHeight: '1.2', padding: '12px 24px'}}>
                GET IN TOUCH
              </Button>
            </Link>
            <Button 
              className="bg-transparent border-2 border-black hover:bg-black hover:text-white text-black font-bold uppercase"
              style={{fontSize: '20px', lineHeight: '1.2', padding: '12px 24px'}}
              onClick={() => window.open('https://twitter.com', '_blank')}
            >
              TWITTER
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}