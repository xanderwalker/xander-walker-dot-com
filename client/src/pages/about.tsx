import { Link } from 'wouter';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import modelsImage from "@assets/2014-02-21_06.58.54_Original_1750960142835.png";

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
      image: "/assets/vikingadventureweb_1750891603225.png"
    },
    {
      year: "2018",
      title: "Model 3 launch & ramp: \"delivery logistics hell\" and back.",
      image: "/assets/model3web_1750891603218.png"
    },
    {
      year: "2016",
      title: "Tesla Remarketing: wholesale auctions, retail sales, residual values, repair & refurbishment, dynamic pricing.",
      image: null
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
      image: modelsImage
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
          <h2 className="mb-12 text-center text-black" style={{fontSize: '55px', lineHeight: '1.2'}}>
            RESUME
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {timelineEvents.map((event, index) => (
              <div key={index} className="glassmorphism rounded-2xl p-6 relative z-30 pointer-events-auto">
                {/* Date at top */}
                <div className="text-black mb-4 text-center" style={{fontSize: '32px', lineHeight: '1.2'}}>
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
                <div className="text-black text-center" style={{fontSize: '18px', lineHeight: '1.3'}}>
                  {event.title}
                </div>
              </div>
            ))}
          </div>
        </div>


      </div>
    </Layout>
  );
}