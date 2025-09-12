import axios from "axios";
import { useState } from "react";
export default function NewWeekendModal() {
  const [weekends, setWeekends] = useState(null);
  console.log(weekends);
  return (
    <>
      <dialog
        id="my_modal_4"
        className="modal modal-bottom sm:modal-middle text-start"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            e.currentTarget.close();
          }
        }}
      >
        <div className="modal-box ">
          <h3 className="font-bold text-lg text-center">New Weekend</h3>
          <form
            className="flex flex-col gap-4 justify-center items-center"
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const raw = Object.fromEntries(formData.entries());
              const payload = {
                ...raw,
              };
              try {
                const res = await axios.post(
                  `${import.meta.env.VITE_BACKEND_URL}/api/weekends`,
                  payload,
                  {
                    withCredentials: true,
                  }
                );
                setWeekends((prev) =>
                  prev
                    ? { ...prev, items: [res.data, ...prev.items] }
                    : { items: [res.data] }
                );
                document.getElementById("my_modal_4").close();
                e.target.reset();
              } catch (error) {
                console.error("Failed to create the activity", error);
              }
            }}
          >
            <div className="form-control w-full max-w-xs">
              <label className="label">
                <span className="label-text">Title*</span>
              </label>
              <input
                type="text"
                name="title"
                placeholder="Type here"
                className="input input-bordered w-full max-w-xs"
                required
              />
            </div>
            <div className="form-control w-full max-w-xs">
              <label className="label">
                <span className="label-text">Start Date*</span>
              </label>
              <input
                type="date"
                name="startDate"
                placeholder="Type here"
                className="input input-bordered w-full max-w-xs"
                required
              />
            </div>
            <div className="form-control w-full max-w-xs">
              <label className="label">
                <span className="label-text">End Date*</span>
              </label>
              <input
                type="date"
                name="endDate"
                placeholder="Type here"
                className="input input-bordered w-full max-w-xs"
                required
              />
            </div>
            
            <div className="form-control w-full max-w-xs">
              <label className="label">
                <span className="label-text">Mood</span>
              </label>
              <input
                type="text"
                name="mood"
                placeholder="e.g. Outdoor, Relaxation"
                className="input input-bordered w-full max-w-xs"
              />
            </div>

            <button className="btn btn-accent w-full max-w-xs">Submit</button>
          </form>
        </div>
      </dialog>
    </>
  );
}
