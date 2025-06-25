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
    <Layout title="BIO">
      <div className="max-w-5xl mx-auto">
        {/* Artwork Gallery */}
        <div className="mb-16">
          <h2 className="font-xanman-wide text-3xl font-bold mb-8 text-center text-black">
            Selected Works
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            <img src="/assets/model3web_1750891603218.png" alt="Tesla Model 3" className="w-full h-auto glassmorphism rounded-lg p-4" />
            <img src="/assets/edvweb_1750891603225.png" alt="Amazon EDV" className="w-full h-auto glassmorphism rounded-lg p-4" />
            <img src="/assets/vikingadventureweb_1750891603225.png" alt="Viking Adventure" className="w-full h-auto glassmorphism rounded-lg p-4" />
            <img src="/assets/r1tweb_1750891603226.png" alt="Rivian R1T" className="w-full h-auto glassmorphism rounded-lg p-4" />
            <img src="/assets/flyerweb_1750891603226.png" alt="Flyer" className="w-full h-auto glassmorphism rounded-lg p-4" />
            <img src="/assets/aspenweb_1750891603226.png" alt="Aspen" className="w-full h-auto glassmorphism rounded-lg p-4" />
            <img src="/assets/modelxweb_1750891603226.png" alt="Tesla Model X" className="w-full h-auto glassmorphism rounded-lg p-4" />
            <img src="/assets/tulaneforweb2_1750891603227.png" alt="Tulane" className="w-full h-auto glassmorphism rounded-lg p-4" />
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-12">
          <h2 className="font-xanman-wide text-3xl font-bold mb-8 text-center text-black">
            Timeline
          </h2>
          <div className="space-y-6">
            {timelineEvents.map((event, index) => (
              <div key={index} className="glassmorphism rounded-2xl p-6 border-l-4 border-black border-opacity-20">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className={`text-${event.color} font-xanman-wide text-xl font-bold min-w-24`}>
                    {event.year}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-xanman-wide text-lg font-semibold text-black mb-2">
                      {event.title}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="glassmorphism rounded-2xl p-8 text-center mb-8">
          <p className="text-gray-700 mb-6 font-xanman-wide">
            If you'd like me to add some more color to this story, shoot me an email or a dm on twitter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button className="bg-electric-orange hover:bg-electric-orange hover:opacity-90 text-black font-xanman-wide">
                Get in Touch
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="bg-black bg-opacity-10 border-black border-opacity-20 hover:bg-opacity-20 font-xanman-wide">
                ← Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
