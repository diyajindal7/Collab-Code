import { useParams } from "react-router-dom";

export default function Room() {

    const { roomCode } = useParams();

    return (

        <div className="min-h-screen bg-slate-950 text-white flex justify-center items-center">

            <h1 className="text-5xl font-bold">

                Room Code : {roomCode}

            </h1>

        </div>

    );
}