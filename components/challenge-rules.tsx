import { Info } from "lucide-react"

export default function ChallengeRules() {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="flex items-start">
        <div className="bg-blue-100 p-2 rounded-full mr-4 mt-1">
          <Info className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold mb-2">챌린지 규칙</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="font-medium mr-2">•</span>
              <span>챌린지 성공 기준 : 챌린지 기간 내에 15개 이상의 인정 포스팅 완료.</span>
            </li>
            <li className="flex items-start">
              <span className="font-medium mr-2">•</span>
              <span>인정 포스팅 기준: 글자 수(공백 제외) 1,000자 이상, 이미지 3장 이상을 모두 충족해야 합니다.</span>
            </li>
            <li className="flex items-start">
              <span className="font-medium mr-2">•</span>
              <span>동률로 인해 챌린지 순위 TOP2가 3개 캠퍼스 이상일 경우 TOP2 현황에는 최근 포스팅 등록 순서로 2개 캠퍼스만 보여 집니다.</span>
            </li>
            <li className="flex items-start">
              <span className="font-medium mr-2">•</span>
              <span>최종 순위는 인정 포스팅 수를 기준으로 결정되며, 포스팅 수가 동일한 경우 포스팅의 품질을 종합적으로 판단하여 결정됩니다.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
