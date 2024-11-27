import React from 'react';
import { Navbar, Nav, Offcanvas, Button } from 'react-bootstrap';
import styled from 'styled-components';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const ContentWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-top: 50px; /* Height of the TopBarContainer */
  padding: 20px; /* Add padding if needed */
`;

const TopBarContainer = styled.div`
  background-color: #007bff;
  color: #fff;
  padding: 10px 20px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  height: 50px;
  border-radius: 0 0 10px 10px;
`;

const TopBarText = styled.span`
  font-weight: bold;
  transition: transform 0.3s, color 0.3s;
  font-size: 16px;
  cursor: pointer;
  &:hover {
    color: #000;
    transform: scale(1.05);
  }
  margin-left: 10px;
`;

const LogoutButton = styled.button`
  background-color: #ff4b5c;
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 5px;
  font-size: 14px;
`;

const FooterContainer = styled.div`
  background-color: #007bff;
  color: #fff;
  padding: 10px 20px;
  width: 100%;
  border-radius: 10px 10px 0 0;
  font-family: 'Arial', sans-serif;
  display: flex;
  justify-content: space-between;
  position: relative;
`;

const EmailText = styled.span`
  margin-right: 5px;
`;

const EmailLink = styled.a`
  color: #fff;
  text-decoration: none;
  &:hover {
    color: #000;
  }
`;

const HamburgerIcon = styled.div`
  width: 30px;
  height: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
`;

const Bar = styled.div`
  height: 4px;
  background-color: white;
`;

const Layout = ({ panelTitle, children, onLogout, menuItems }) => {
  const [show, setShow] = React.useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <PageContainer>
      <TopBarContainer>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <HamburgerIcon onClick={handleShow}>
            <Bar />
            <Bar />
            <Bar />
          </HamburgerIcon>
          <TopBarText>{panelTitle}</TopBarText>
        </div>
        <LogoutButton onClick={onLogout}>Wyloguj się</LogoutButton>
      </TopBarContainer>

      <Offcanvas show={show} onHide={handleClose}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column">
            {menuItems.map((item, index) => (
              <Nav.Link key={index} onClick={item.action} style={item.style} disabled={item.disabled}>
                {item.label}
              </Nav.Link>
            ))}
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>

      <ContentWrapper>
        {children}
      </ContentWrapper>

      <FooterContainer>
        <div>
          <EmailText>email:</EmailText>
          <EmailLink href="mailto:sebastiankomorek0503@gmail.com">sebastiankomorek0503@gmail.com</EmailLink>
        </div>
        <span>Autor: Sebastian Komorek @ 2024</span>
      </FooterContainer>
    </PageContainer>
  );
};

export default Layout;
