import FetchLocations from "../../src/components/locations/LocationListing";
//import ImportCsvToFirebase from "../components/locations/ImportCSV.jsx";
export default function Home() {
  return (
    <main className="p-8 m-4 bg-white shadow rounded-lg">
      <FetchLocations />
      {
        //<ImportCsvToFirebase />
      }
    </main>
  );
}
