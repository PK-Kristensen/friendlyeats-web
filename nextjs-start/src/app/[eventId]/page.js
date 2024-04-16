'use client'
import EventPage from "./EventPage";
import { getUser } from "@/src/lib/getUser";

export default function Page({ params: { eventId } }) {
    const user = getUser();
    return (
        <div>
        {user? 
            <EventPage user={user.uid} eventId={eventId} />
        :
            <p>Log in to access the event</p>
        }
        </div>
    );
    }



