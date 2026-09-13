import { resume } from './resume.mjs';

const records = resume.records;
const group = (...prefixes) => records.filter(r => prefixes.some(p => r.id === p || r.id.startsWith(p + '-')));
const absent = { kind: 'absent', records: [], text: '简历中未提及，暂时无法根据这份资料回答。' };
const unsupported = /薪资|薪水|工资|薪酬|待遇|期望薪|月薪|年薪|几岁|年龄|出生|生日|籍贯|家乡|身高|体重|婚姻|结婚|男朋友|女朋友|爱好|业余|最喜欢|为什么|原因|离职|跳槽|性取向|宗教|身份证|家庭住址|家庭成员|家庭背景|父母|父亲|母亲|户籍|护照|签证|政治面貌|求职意向|期望岗位|到岗|入职时间|未来计划|职业规划|人生规划|托福|日语|法语|德语|西班牙语|韩语|意大利语|编程|代码能力|python|javascript|react|java\b|c\+\+|gre\b|gmat|toefl|salary|age\b|birthday|hobb|marri|reason|relocat|visa|spanish|french|japanese/i;

// Deterministic, device-local retrieval. No API calls and no generated answers.
// Result text is sourced exclusively from the immutable resume records.
export function searchResume(question) {
  const q = String(question).normalize('NFKC').trim();
  if (!q || q.length > 500) return { ...absent, kind: 'invalid', text: '请输入 1–500 字的问题。' };
  if (unsupported.test(q)) return absent;
  let found = [];
  if (/是谁|叫什么|介绍.*(自己|你)|自我介绍|个人简介|个人介绍|who are you|introduce yourself/i.test(q)) {
    found = group('profile','masters','hr-1','teaching-1','translation-1');
  } else if (/电话|手机号|邮箱|电子邮件|联系|现居|住在哪|哪个城市|哪里人|contact|email|phone|location/i.test(q)) {
    found = group('contact');
  } else if (/雅思.*(成绩|分|考得)|ielts.*(score|band)|口语.*(分|成绩)|英语.*(成绩|水平)|语言.*(成绩|水平)|四六级|六级|专八|tem.?8|cet.?6|雅思多少/i.test(q)) {
    found = group('certificates');
  } else if (/证书|资格证|资质|certificate|certification/i.test(q)) {
    found = /技能|工具|skill/i.test(q) ? group('certificates','tools','office') : group('certificates');
  } else if (/学校|学历|教育背景|读书|大学|研究生|硕士|本科|毕业|专业|主修|课程.*学|education|university|degree|master|bachelor|graduate/i.test(q)) {
    found = /本科|景德镇学院|bachelor/i.test(q) && !/硕士|研究生|教育背景|master/i.test(q) ? group('bachelors') : /硕士|研究生|西安电子科技|master/i.test(q) && !/本科|教育背景|bachelor/i.test(q) ? group('masters') : group('masters','bachelors');
  } else if (/codex|人工智能|\bai\b/i.test(q)) {
    found = group('tools','teaching-4','research-2');
  } else if (/xmind|思维导图/i.test(q)) {
    found = group('tools','research-1');
  } else if (/excel|表格|数据统计/i.test(q)) {
    found = group('office','hr-4');
  } else if (/word|powerpoint|ppt|办公/i.test(q)) {
    found = group('office');
  } else if (/技能|工具|会什么|擅长什么|skills|tools/i.test(q)) {
    found = group('certificates','tools','office');
  } else if (/招聘|人力|\bhr\b|奇富|墨西哥|海外|候选人|面试|录用|recruit|mexico|candidate/i.test(q)) {
    found = /录用|入职|offer|接受/i.test(q) ? group('hr-4') : /面试|英文沟通|英文联系|interview/i.test(q) ? group('hr-3') : /筛选|mapping|目标公司|找人|搜寻/i.test(q) ? group('hr-1','hr-2') : group('hr');
  } else if (/教研|橙冠|题库|录制|录音|剪辑|质检|雅思|ielts/i.test(q)) {
    found = /录音|录制|音频|剪辑/i.test(q) ? group('research-3') : group('research');
  } else if (/教学|授课|讲课|老师|教师|博睿|辅导|带教|课时|学生|学员|家长|备课|提分|续费|留存|teach|tutor/i.test(q)) {
    found = /提分|成绩.*(提高|提升)|60分|90分/i.test(q) ? group('teaching-3') : /续费|留存|家长|档案|试听/i.test(q) ? group('teaching-6') : /备课|调整|错题|计划/i.test(q) ? group('teaching-4','teaching-5') : group('teaching');
  } else if (/陪同|口译|文化交流|interpret/i.test(q)) {
    found = group('interpreting');
  } else if (/翻译|笔译|外贸|睿恩|术语|英汉|translate|translation/i.test(q)) {
    found = /术语|品类/i.test(q) ? group('translation-2') : group('translation','interpreting');
  } else if (/校园|社团|活动|话剧|报销|经费|预算|club|campus/i.test(q)) {
    found = /报销|经费|预算/i.test(q) ? group('club-3') : group('club','interpreting');
  } else if (/自我评价|优势|性格|工作能力|专业能力|评价自己|strength|personality/i.test(q)) {
    found = group('self');
  } else if (/工作经历|实习经历|工作经验|实习|做过什么|履历|经历|experience|internship/i.test(q)) {
    found = group('hr','teaching','research','translation');
  }
  if (!found.length) return absent;
  return { kind: 'found', records: found, text: '我在简历里找到了这些相关记录：' };
}
