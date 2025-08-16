// import Control from "@/components/learning/sorting/Control";
import BubbleSort from "@/components/learning/sorting/BubbleSort";
import SelectionSort from "@/components/learning/sorting/SelectionSort";
import InsertionSort from "@/components/learning/sorting/InsertionSort";

// import AINotesPage from "@/components/learning/AINotes.tsx/AINotesPage";
import AINotesPage from "@/components/learning/AINotes.tsx/AINotes";
import SortingVisualizerApp from "@/components/learning/AINotes.tsx/sortingVisualizerApp";
import SortingVisualizerApp2 from "@/components/learning/AINotes.tsx/sortingVisualizerApp2";
import SortingControls from "@/components/learning/sorting/SortingControl";

export default function Home() {
  return (
    <>
      {/* {/* <div>
        <BubbleSort />
      </div> */}
      {/* <div>
        <InsertionSort />
      </div> */}
      <div>
        <SelectionSort />
      </div>
      {/* <div>
        <SortingVisualizerApp />
      </div>  */}
      {/* <div>
        <SortingVisualizerApp2 />
      </div> */}
      {/* <SelectionSort /> */}

      {/* <SortingControls /> */}

      {/* <div>
        <AINotesPage />
      </div> */}
    </>
  );
}
