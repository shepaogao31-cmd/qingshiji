import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import HomePage from "@/pages/HomePage/HomePage";
import DietPage from "@/pages/DietPage/DietPage";
import ExercisePage from "@/pages/ExercisePage/ExercisePage";
import TrainingPage from "@/pages/TrainingPage/TrainingPage";
import ProfilePage from "@/pages/ProfilePage/ProfilePage";
import FoodEditPage from "@/pages/FoodEditPage/FoodEditPage";
import FoodPickerPage from "@/pages/FoodPickerPage/FoodPickerPage";
import NotFoundPage from "@/pages/NotFoundPage/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="diet" element={<DietPage />} />
        <Route path="exercise" element={<ExercisePage />} />
        <Route path="training" element={<TrainingPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="food-edit" element={<FoodEditPage />} />
        <Route path="food-picker" element={<FoodPickerPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
