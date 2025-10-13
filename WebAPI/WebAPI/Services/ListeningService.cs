﻿using WebAPI.DTOs;
using WebAPI.Models;
using WebAPI.Repositories;

namespace WebAPI.Services
{
    public class ListeningService : IListeningService
    {
        private readonly IListeningRepository _repo;

        public ListeningService(IListeningRepository repo)
        {
            _repo = repo;
        }

        public ListeningDto? GetById(int id)
        {
            var r = _repo.GetById(id);
            return r == null ? null : MapToDto(r);
        }

        public List<ListeningDto> GetByExam(int examId)
        {
            return _repo.GetByExamId(examId).Select(MapToDto).ToList();
        }

        public ListeningDto Create(CreateListeningDto dto)
        {
            var entity = new Listening
            {
                ExamId = dto.ExamId,
                ListeningContent = dto.ListeningContent,
                ListeningQuestion = dto.ListeningQuestion,
                ListeningType = dto.ListeningType,
                DisplayOrder = dto.DisplayOrder,
                CorrectAnswer = dto.CorrectAnswer,
                QuestionHtml = dto.QuestionHtml,
                CreatedAt = DateTime.UtcNow
            };

            _repo.Add(entity);
            _repo.SaveChanges();
            return MapToDto(entity);
        }

        public ListeningDto? Update(int id, UpdateListeningDto dto)
        {
            var existing = _repo.GetById(id);
            if (existing == null) return null;

            if (dto.ListeningContent != null) existing.ListeningContent = dto.ListeningContent;
            if (dto.ListeningQuestion != null) existing.ListeningQuestion = dto.ListeningQuestion;
            if (dto.ListeningType != null) existing.ListeningType = dto.ListeningType;
            if (dto.DisplayOrder.HasValue) existing.DisplayOrder = dto.DisplayOrder.Value;
            if (dto.CorrectAnswer != null) existing.CorrectAnswer = dto.CorrectAnswer;
            if (dto.QuestionHtml != null) existing.QuestionHtml = dto.QuestionHtml;

            _repo.Update(existing);
            _repo.SaveChanges();

            return MapToDto(existing);
        }

        public bool Delete(int id)
        {
            var existing = _repo.GetById(id);
            if (existing == null) return false;

            _repo.Delete(existing);
            _repo.SaveChanges();
            return true;
        }

        private static ListeningDto MapToDto(Listening r) =>
            new ListeningDto
            {
                ListeningId = r.ListeningId,
                ExamId = r.ExamId,
                ListeningContent = r.ListeningContent,
                ListeningQuestion = r.ListeningQuestion,
                ListeningType = r.ListeningType,
                DisplayOrder = r.DisplayOrder,
                CreatedAt = r.CreatedAt,
                CorrectAnswer = r.CorrectAnswer,
                QuestionHtml = r.QuestionHtml
            };
        public decimal EvaluateListening(SubmitAttemptDto dto)
        {
            var userGroups = System.Text.Json.JsonSerializer
                .Deserialize<List<UserAnswerGroup>>(dto.AnswerText)
                ?? new List<UserAnswerGroup>();

            var Listenings = GetByExam(dto.ExamId);

            int totalQuestions = 0;
            int correctCount = 0;

            foreach (var Listening in Listenings)
            {
                var userGroup = userGroups.FirstOrDefault(g => g.SkillId == Listening.ListeningId);
                if (userGroup == null) continue;

                List<string> correctAnswers = new();
                if (!string.IsNullOrEmpty(Listening.CorrectAnswer))
                {
                    try
                    {
                        correctAnswers = System.Text.Json.JsonSerializer
                            .Deserialize<List<string>>(Listening.CorrectAnswer)
                            ?? new();
                    }
                    catch { }
                }

                totalQuestions += correctAnswers.Count;

                foreach (var ans in userGroup.Answers)
                {
                    if (correctAnswers.Any(c =>
                        string.Equals(ans?.Trim(), c?.Trim(), StringComparison.OrdinalIgnoreCase)))
                    {
                        correctCount++;
                    }
                }
            }

            return totalQuestions > 0
                ? Math.Round((decimal)correctCount / totalQuestions * 9, 2)
                : 0;
        }

    }
}
