import axios from "axios";

const API = axios.create({
  baseURL: "/api/writing",
  withCredentials: true,
});

export function getAll() {
  return API.get("").then((res) => res.data);
}

export function getByExam(examId) {
  return API.get(`/exam/${examId}`).then((res) => res.data);
}

export function getById(id) {
  return API.get(`/${id}`).then((res) => res.data);
}

export function add(data) {
  return API.post("", data).then((res) => res.data);
}

export function update(id, data) {
  return API.put(`/${id}`, data).then((res) => res.data);
}

export function remove(id) {
  return API.delete(`/${id}`);
}

export function attachImageToWriting(writingId, file) {
  return uploadImage(file)
    .then((url) => update(writingId, { imageUrl: url }))
    .then((res) => res);
}

export function gradeWriting(gradeData) {
  return API.post("/grade", gradeData).then((res) => res.data);
}

export const getFeedback = (examId, userId) =>
  API.get(`/feedback/${examId}/${userId}`).then((res) => res.data);
