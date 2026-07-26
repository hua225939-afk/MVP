import { z } from "zod";

const demoIdentitySchema = z.object({
  schemaVersion: z.literal(1),
  hq: z.object({ id: z.string(), name: z.string(), isDemo: z.literal(true) }),
  partner: z.object({
    id: z.string(),
    name: z.string(),
    campusId: z.string(),
    isDemo: z.literal(true),
  }),
  campus: z.object({
    id: z.string(),
    partnerId: z.string(),
    name: z.string(),
    city: z.string(),
    isDemo: z.literal(true),
  }),
  classRecord: z.object({
    id: z.string(),
    campusId: z.string(),
    teacherId: z.string(),
    name: z.string(),
    schedule: z.string(),
    room: z.string(),
    isDemo: z.literal(true),
  }),
  teacher: z.object({
    id: z.string(),
    name: z.string(),
    classIds: z.array(z.string()).length(1),
    isDemo: z.literal(true),
  }),
  student: z.object({
    id: z.string(),
    name: z.string(),
    classId: z.string(),
    isDemo: z.literal(true),
  }),
  parent: z.object({
    id: z.string(),
    name: z.string(),
    studentIds: z.array(z.string()).length(1),
    isDemo: z.literal(true),
  }),
});

export const demoIdentities = demoIdentitySchema.parse({
  schemaVersion: 1,
  hq: { id: "hq-demo", name: "Vibe Coding Lab 总部", isDemo: true },
  partner: {
    id: "partner-star",
    name: "星河教育演示校区",
    campusId: "campus-demo",
    isDemo: true,
  },
  campus: {
    id: "campus-demo",
    partnerId: "partner-star",
    name: "徐汇创意演示校区",
    city: "上海",
    isDemo: true,
  },
  classRecord: {
    id: "class-demo",
    campusId: "campus-demo",
    teacherId: "teacher-lin",
    name: "创意编程演示班",
    schedule: "周六 10:00",
    room: "探索教室 1",
    isDemo: true,
  },
  teacher: {
    id: "teacher-lin",
    name: "林老师",
    classIds: ["class-demo"],
    isDemo: true,
  },
  student: {
    id: "student-an",
    name: "安安",
    classId: "class-demo",
    isDemo: true,
  },
  parent: {
    id: "parent-demo",
    name: "安安家长",
    studentIds: ["student-an"],
    isDemo: true,
  },
});

export type DemoIdentities = typeof demoIdentities;

