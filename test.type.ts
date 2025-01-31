import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateUserByStudentNumber(studentNumber, updates) {
  try {
    // 사용자 검색
    const user = await prisma.user.findUnique({
      where: {
        studentNumber: studentNumber,
      },
    });

    if (!user) {
      throw new Error(`User with studentNumber ${studentNumber} not found`);
    }

    // 업데이트 데이터 구성
    const updateData = {
      isBbunRegistered: true, // 등록 상태 변경
      ...(updates.department && { department: updates.department }),
      ...(updates.MBTI && { MBTI: updates.MBTI }),
      ...(updates.description && { description: updates.description }),
    };

    // 사용자 정보 업데이트
    const updatedUser = await prisma.user.update({
      where: {
        studentNumber: studentNumber,
      },
      data: updateData,
    });

    console.log('User updated successfully:', updatedUser);
    return updatedUser;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

// 함수 호출 예제
updateUserByStudentNumber('20230001', {
  department: 'Computer Science',
  MBTI: 'ENTP',
  description: 'Excited to be here!',
});
