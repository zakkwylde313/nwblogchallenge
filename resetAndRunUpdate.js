import { exec } from 'child_process';
import readline from 'readline';

// 사용자 입력을 받기 위한 인터페이스 생성
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('파이어스토어 데이터베이스 초기화 및 업데이트 스크립트');
console.log('---------------------------------------------------');
console.log('주의: 이 작업은 모든 데이터베이스 컬렉션을 지우고 다시 시작합니다.');
console.log('데이터가 모두 삭제되며 복구할 수 없습니다.');

rl.question('정말로 데이터베이스를 초기화하고 업데이트 스크립트를 실행하시겠습니까? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    console.log('\n데이터베이스 초기화 진행 중...');
    
    // clearFirestoreCollections.js 실행
    exec('node clearFirestoreCollections.js', (error, stdout, stderr) => {
      if (error) {
        console.error('데이터베이스 초기화 중 오류 발생:', error);
        rl.close();
        return;
      }
      
      console.log(stdout);
      console.log('\n데이터베이스 초기화 완료. 업데이트 스크립트 실행 중...');
      
      // runDailyUpdateLocally.js 실행
      exec('node runDailyUpdateLocally.js', (error, stdout, stderr) => {
        if (error) {
          console.error('업데이트 스크립트 실행 중 오류 발생:', error);
          rl.close();
          return;
        }
        
        console.log(stdout);
        console.log('\n모든 작업이 완료되었습니다.');
        rl.close();
      });
    });
  } else {
    console.log('\n작업이 취소되었습니다.');
    rl.close();
  }
}); 