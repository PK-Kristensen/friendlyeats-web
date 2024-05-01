
import EventListings from "../../src/components/EventListings";
export default function Home({ searchParams }) {

  return (
    <main>
        <EventListings searchParams={searchParams} />
    </main>
  );
}
