
import EventListings from "../../../src/components/EventListings";
export default function Home({ searchParams }) {

  return (
    <main className="main__home">
        <EventListings searchParams={searchParams} />
    </main>
  );
}
