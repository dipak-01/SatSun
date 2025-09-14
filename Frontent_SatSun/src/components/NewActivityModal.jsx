import api from "../lib/api";
import { useState } from "react";
export default function NewActivityModal() {
  const [activities, setActivities] = useState(null);
  console.log(activities);
  return (
    <>
      <dialog
        id="my_modal_5"
        className="modal modal-middle sm:modal-middle text-start"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            e.currentTarget.close();
          }
        }}
      >
        <div className="modal-box w-full max-w-lg">
          <h3 className="font-bold text-lg text-center">New Activity</h3>
          <form
            className="mt-4 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const raw = Object.fromEntries(formData.entries());
              const payload = {
                ...raw,
                durationMin: raw.durationMin
                  ? Number(raw.durationMin)
                  : undefined,
                isPremium: formData.get("isPremium") === "on",
                tags: raw.tags
                  ? raw.tags
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                  : [],
              };
              try {
                const res = await api.post(`activities`, payload);
                setActivities((prev) =>
                  prev
                    ? { ...prev, items: [res.data, ...prev.items] }
                    : { items: [res.data] }
                );
                document.getElementById("my_modal_5").close();
                e.target.reset();
              } catch (error) {
                console.error("Failed to create the activity", error);
              }
            }}
          >
            <div className="form-control w-full">
              <div className="label justify-start">
                <span className="label-text">Title*</span>
              </div>
              <input
                type="text"
                name="title"
                placeholder="Type here"
                className="input input-bordered w-full"
                required
              />
            </div>
            <div className="form-control w-full">
              <div className="label justify-start">
                <span className="label-text">Description</span>
              </div>
              <textarea
                name="description"
                className="textarea textarea-bordered h-24 w-full"
                placeholder="Activity description"
              ></textarea>
            </div>
            <div className="form-control w-full">
              <div className="label justify-start">
                <span className="label-text">Category</span>
              </div>
              <input
                type="text"
                name="category"
                placeholder="e.g. Outdoor, Relaxation"
                className="input input-bordered w-full"
              />
            </div>
            <div className="form-control w-full">
              <div className="label justify-start">
                <span className="label-text">Duration (min)*</span>
              </div>
              <input
                type="number"
                name="durationMin"
                placeholder="e.g. 30"
                className="input input-bordered w-full"
                required
              />
            </div>
            <div className="form-control w-full">
              <div className="label justify-start">
                <span className="label-text">Icon</span>
              </div>
              <input
                type="text"
                name="icon"
                placeholder="e.g. 🏞️, 🧘‍♂️"
                className="input input-bordered w-full"
              />
            </div>
            <div className="form-control w-full">
              <div className="label justify-start">
                <span className="label-text">Tags (comma separated)</span>
              </div>
              <input
                type="text"
                name="tags"
                placeholder="e.g. hiking, nature"
                className="input input-bordered w-full"
              />
            </div>
            <div className="form-control w-full">
              <div className="label justify-start">
                <span className="label-text">Is Premium?</span>
              </div>
              <input
                type="checkbox"
                name="isPremium"
                className="checkbox checkbox-accent"
              />
            </div>
            <div className="form-control w-full">
              <div className="label justify-start">
                <span className="label-text">Default Mood</span>
              </div>
              <input
                type="text"
                name="defaultMood"
                placeholder="e.g. relaxed, energized"
                className="input input-bordered w-full"
              ></input>
            </div>
            <button className="btn btn-accent w-full">Submit</button>
          </form>
        </div>
      </dialog>
    </>
  );
}
