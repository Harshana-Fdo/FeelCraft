import { Link } from 'react-router';
import PageIntro from '../../components/common/PageIntro';
import Process from '../../components/landing/Process';
import Button from '../../components/ui/Button';
import { usePageTitle } from '../../hooks/usePageTitle';

const content = {
  workflow: {
    title: 'How It Works',
    summary: 'Choose a feeling, customize a template or blank canvas, then save your draft and preview how it opens.',
    action: 'Explore Templates', to: '/templates',
  },
  about: {
    title: 'About FeelCraft',
    summary: 'Every feeling deserves a beautiful expression.',
    body: 'FeelCraft is a digital letter studio for the things that can be hard to say out loud. It brings design, animation and a little anticipation to a personal note.',
    action: 'Discover the Feelings', to: '/categories',
  },
  privacy: {
    title: 'Sharing & Privacy',
    summary: 'A personal letter should go to the person you choose.',
    body: 'The current demos use sample letters. The planned publishing workflow will let you copy an unlisted link, choose a signature and revoke access. Share the link only with the intended recipient, since they can forward it.',
    action: 'Try a Sample Letter', to: '/demo/eternal-love',
  },
  pricing: {
    title: 'Pricing',
    summary: 'Every sample letter is free to open today.',
    body: 'The gallery includes free templates and previews of designs intended for a future premium collection. Paid plans and checkout are unavailable in this release.',
    action: 'Browse the Collection', to: '/templates',
  },
};

export default function Info({ section }) {
  const { title, summary, body, action, to } = content[section];
  usePageTitle(title);
  return (
    <section className="shell interior info-page">
      <PageIntro title={title}>{summary}</PageIntro>
      {section === 'workflow' ? <Process /> : <p className="info-body">{body}</p>}
      <Button asChild><Link to={to}>{action}</Link></Button>
    </section>
  );
}
